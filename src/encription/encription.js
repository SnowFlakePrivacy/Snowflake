// TODO: RSA key gen handle in external c++

const crypto = require("crypto");

//Function for creating / importing rsa object
exports.rsa = function(input = 2048, password) {
	//If we got a string we are importing a key
	if(typeof input === 'string') {
		//If we where given a password use it
		if(password){
			var aes = new exports.aes(password);
			input = aes.decript(input);
			delete aes;
		}

		if(input.substring(0, 26) === '-----BEGIN PUBLIC KEY-----'){
			//If input was a public key
			this.publicKey = input;
		}
		else if(input.substring(0,31) === '-----BEGIN RSA PRIVATE KEY-----'){
			//If input was a private key
			this.privateKey = input;
			//TODO: set public key from this info
		}
		else{
			throw new Error('key not good');
		}
	}
	else if(typeof input === 'number'){
		generateKeyPairSync('rsa', {modulusLength: input}, (err, publicKey, privateKey) => {
			if(err){
				console.log(err);
			}
		  this.publicKey = publicKey;
			this.privateKey = privateKey;
		});
	}
	else{
		throw new Error('unexpected input for RSA')
	};

	//Decript a message
	this.encript = function(message) {
		return new Promise((resolve, reject) => {
			//If a public key is not defeined then we just haven't finished genorating them yet
			//Wait 1 second then try again
			if(!this.publicKey && !this.privateKey){
				setTimeout(function(){
					this.encript(message)
					.then((text) => {
						resolve(text);
					})
					.catch((err) => {
						reject(err);
					})
				},1000);
			}
			//When we do have a public key try and encript
			else{
				//If we do then encript it and return it
				resolve(crypto.publicEncrypt(this.privateKey, message));
			}
		});
	};

	//Encript a message
	this.decript = function(message) {
		return new Promise((resolve, reject) => {
			//If a public key is not defeined then we just haven't finished genorating them yet
			//Wait 1 second then try again
			if(!this.publicKey && !this.privateKey){
				setTimeout(function(){
					this.decript(message)
					.then((text) => {
						resolve(text);
					})
					.catch((err) => {
						reject(err);
					})
				},1000);
			}
			else{
				//If we don't have a private key then throw an error
				if(!this.privateKey){
					reject(new Error('Private key not defined'));
				}
				resolve(crypto.privateDecrypt(this.privateKey, message));
			}
		});
	};

	//Sign a message
	this.sign = function(message) {
		return new Promise((resolve, reject) => {
			//If a public key is not defeined then we just haven't finished genorating them yet
			//Wait 1 second then try again
			if(!this.publicKey && !this.privateKey){
				setTimeout(function(){
					this.encript(message)
					.then((text) => {
						resolve(text);
					})
					.catch((err) => {
						reject(err);
					})
				},1000);
			}
			//When we do have a public key try and encript
			else{
				//If we don't have a private key then throw an error
				if(!this.privateKey){
					reject(new Error('Private key not defined'));
				}
				//Hash the message
				message = exports.hash(message, 512);
				//If we do then encript it and return it
				resolve(crypto.privateEncrypt(this.privateKey, message));
			}
		});
	};

	//Verift a message
	this.verify = function(message, signature) {
		return new Promise((resolve, reject) => {
			//If a public key is not defeined then we just haven't finished genorating them yet
			//Wait 1 second then try again
			if(!this.publicKey && !this.privateKey){
				setTimeout(function(){
					this.encript(message)
					.then((text) => {
						resolve(text);
					})
					.catch((err) => {
						reject(err);
					})
				},1000);
			}
			//When we do have a public key try and encript
			else{
				//Hash the message
				message = exports.hash(message, 512);
				//If the hash matches the signature then we are all good
				resolve(crypto.publicDecrypt(this.privateKey, message) === message);
			}
		});
	};

	//Get keys
	this.exportKey = function(type = 'public', password) {
		var out = "";
		if(type === 'private'){
			out = this.privateKey;
		}
		else if(type === 'public'){
			out = this.publicKey;
		}
		else if(type === 'both'){
			out = {
				privateKey: this.privateKey,
				publicKey: this.publicKey
			}
		}
		else{
			return new Error('type not defined');
		}
		//Encript if a password was defined
		if(password){
			var aes = new exports.aes(password);
			if(typeof out === 'string'){
				out = aes.encript(out)
			}
			if(out){
				out.privateKey: aes.encript(out.privateKey);
			}
		}

		return out
	};
}

//AES object
exports.aes = function(key = "") {
	//Gen a key if we didnt defined one
	if(key == ""){
		this.key = exports.randomString(128);
	}
	//Use key if we did
	else {
		this.key = key;
	}

	//Function for encripting text
	this.encript = function(text) {
		return new Promise((resolve, reject) => {
			var cipher = crypto.createCipheriv('aes-192-cbc', this.key, Buffer.alloc(16, 0));
			let encrypted = cipher.update(text, 'utf8', 'hex');
			encrypted += cipher.final('hex');
			resolve(encrypted);
		});
	}

	//Function for decripting text
	this.decript = function(encryptedText) {
		return new Promise((resolve, reject) => {
			var cipher = crypto.createDecipheriv('aes-192-cbc', this.key, Buffer.alloc(16, 0));
			let decrypted = cipher.update(encryptedText, 'utf8', 'hex');
			decrypted += cipher.final('hex');
			resolve(decrypted);
		});
	}

	this.exportKey = function() {
		return this.key;
	}
}

//Function for hashing
exports.hash = function(data, hashBytes, alg = "sha512"){
	var hash = crypto.createHash(alg);
	hash.update(data);

	var output = hash.toString('hex');

	return output.repeat(Math.ceil(hashBytes / output.length)).substring(0, hashBytes);
}

function hashPassword(password, hashCount, hashBytes, salt, alg = "sha512") {
	var hash = crypto.pbkdf2Sync(password, salt, hashCount, hashBytes, alg);
	return hash.toString('hex');
}

//Function for creating a login
exports.newLogin = function(password, hashCount = 10000, hashBytes = 512, salt = 16, alg = 'sha512') {
	//If the input isnt correct then stop
	if (password == undefined) {
		return new Error("No password");
	}

	//If our salt is a number then we want to make a key of its length out of it
	if (Number.isInteger(salt)) {
		salt = crypto.randomBytes(saltBytes).toString('hex');
	}

	//Make our object with all of our data in it
	var login = {
		"alg": alg,
		"hashCount": hashCount,
		"salt": salt,
		"hashBytes": hashBytes,
		//Make hash with above data and our password
		"hash": hashPassword(password, hashCount, hashBytes, salt, alg)
	};

	return login
};

exports.testLogin = function(login, password) {
	if (login == undefined || password == undefined) {
		return false;
	}
	if (login.alg == undefined || login.hash == undefined || login.hashCount == undefined || login.salt == undefined || login.hashBytes == undefined) {
		return false;
	}
	var newHash = hashPassword(password, login.hashCount, login.hashBytes, login.salt, login.alg);
	return newHash == login.hash;
}

exports.randomString = function(size){
	return crypto.randomBytes(Math.ceil(size/2)).toString('hex').substring(0,size);
}

exports.randomNumber = function(min = 0, max){
	if(!max){
		max = min;
		min = 0;
	}

	//If the min is greater then the max then throw error
	if(max <= min){
		throw new Error('min greater then max')
	}

	//Making sure we don't break the ints as much as I am broken
	if (max - min; > 281474976710655){
		return false;
	}
	if(maximum > Number.MAX_SAFE_INTEGER){
		return false;
	}

	//Max bytes
	var maxBytes = 6;
	//Max decimal number
	var maxDec = 281474976710656;

	//Genorate a number
	var randbytes = parseInt(crypto.randomBytes(maxBytes).toString('hex'), 16);

	//Scale the 6 bit number that we genorated to fit our range
	var result = Math.floor(randbytes / maxDec * (max - min + 1) + min);

	//Fix rounding errors
	if(result > max){
		result = max;
	}

	//Return result
	return result;
}
