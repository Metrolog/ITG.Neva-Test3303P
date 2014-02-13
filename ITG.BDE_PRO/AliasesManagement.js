// http://stackoverflow.com/questions/471424/wix-tricks-and-tips

function InstallBDEAliases_CA() {
	try {
		LogMessage( "Preparing BDE configuration operations..." );
		BackupAndRestoreBDEConfig();
		// теперь собственно создание алиасов и прочие необходимые действия по конфигурации
		// ...
		LogMessage( "BDE configuration operations was successfully scheduled." );
	} catch ( exc ) {
		LogException( exc );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function BackupAndRestoreBDEConfig() {
	var backupFileName = Session.Property( "BDECONFIGBACKUPFILE" );
	if ( !backupFileName ) {
		LogMessage( "Attempt to schedule BDE configuration backup and restore operations..." );
		var FSO = new ActiveXObject("Scripting.FileSystemObject");
		var backupFileName = FSO.BuildPath(
			FSO.GetSpecialFolder( 2 ),
			FSO.GetTempName()
		);
		Session.Property( "BDEBackupConfig" ) = backupFileName;
		Session.DoAction( "BDEBackupConfig" );
		Session.Property( "BDERestoreConfig" ) = backupFileName;
		Session.DoAction( "BDERestoreConfig" );
		Session.Property( "BDECONFIGBACKUPFILE" ) = backupFileName;
		LogMessage( "BDE configuration backup and restore operations was successfully scheduled." );
	};
	LogMessage( "BDE configuration backup full filename " + backupFileName );
};

function BDEBackupConfig_CA() {
	// deferred
	try {
		LogMessage( "Attempt to backup BDE configuration..." );
		var backupFileName = Session.Property( "CustomActionData" );
		LogMessage( "Backup file name " + backupFileName );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		LogMessage( "ITG.BDEAdministrator is avaliable." );
		var BDEResult = BDEAdmin.BackupConfigFileAs( backupFileName );
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "BDE configuration was successfully backuped." );
	} catch ( exc ) {
		LogException( exc );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function BDERestoreConfig_CA() {
	// rollback
	try {
		LogMessage( "Attempt to restore BDE configuration..." );
		var backupFileName = Session.Property( "CustomActionData" );
		LogMessage( "Backup file name " + backupFileName );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		LogMessage( "ITG.BDEAdministrator is avaliable." );
		var BDEResult = BDEAdmin.RestoreConfigFileFrom( backupFileName );
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "BDE configuration was successfully restored." );
	} catch ( exc ) {
		LogException( exc );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function InstallBDEAlias_CA() {
	// deferred
	try {
		LogMessage( "Attempt to register new BDE alias..." );
		var data = Session.Property( "CustomActionData" );
		LogMessage( "Parameters " + data );
		var Params = JSON.parse( data );
		LogMessage( "Alias name        : " + Params.DataSource );
		LogMessage( "Alias driver      : " + Params.DriverDescription );
		LogMessage( "Alias description : " + Params.Description );
		LogMessage( "Alias parameters  : " + Params.Parameters );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		var BDEResult = BDEAdmin.Init();
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "ITG.BDEAdministrator is successfully initialized." );
		BDEResult = BDEAdmin.AddAlias(
			Params.DataSource,
			Params.DriverDescription,
			Params.Parameters
		);
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		BDEResult = BDEAdmin.SaveConfigFile();
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "BDE configuration is successfully saved." );
		BDEResult = BDEAdmin.Done();
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "BDE alias was successfully added." );
	} catch ( exc ) {
		LogException( exc );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function RemoveBDEAliases_CA() {
	try {
		LogMessage( "Preparing BDE configuration operations..." );
		BackupAndRestoreBDEConfig();
		// теперь собственно удаление алиасов и прочие необходимые действия по конфигурации
		// ...
		LogMessage( "BDE configuration operations was successfully scheduled." );
	} catch ( exc ) {
		LogException( exc );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function RemoveBDEAlias_CA() {
	// deferred
	try {
		LogMessage( "Attempt to delete BDE alias..." );
		var data = Session.Property( "CustomActionData" );
		LogMessage( "Parameters " + data );
		var Params = JSON.parse( data );
		LogMessage( "Alias name        : " + Params.DataSource );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		var BDEResult = BDEAdmin.Init();
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "ITG.BDEAdministrator is successfully initialized." );
		BDEResult = BDEAdmin.DeleteAlias(
			Params.DataSource
		);
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		BDEResult = BDEAdmin.SaveConfigFile();
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "BDE configuration is successfully saved." );
		BDEResult = BDEAdmin.Done();
		if ( BDEResult != 0 ) { throw new Error( BDEResult ); };
		LogMessage( "BDE alias was successfully deleted." );
	} catch ( exc ) {
		LogException( exc );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

// http://msdn.microsoft.com/en-us/library/sfw6660x(VS.85).aspx
var Buttons = {
	OkOnly           : 0,
	OkCancel         : 1,
	AbortRetryIgnore : 2,
	YesNoCancel      : 3
};

var Icons = {
	Critical         : 16,
	Question         : 32,
	Exclamation      : 48,
	Information      : 64
};

var MsgKind = {
	Error            : 0x01000000,
	Warning          : 0x02000000,
	User             : 0x03000000,
	Log              : 0x04000000
};

// http://msdn.microsoft.com/en-us/library/aa371254(VS.85).aspx
var MsiActionStatus = {
	None             : 0,
	Ok               : 1,
	Cancel           : 2,
	Abort            : 3,
	Retry            : 4,
	Ignore           : 5
};

// Pop a message box. Also spool a message into the MSI log, if it is enabled. 
function LogException( exc ) {
	var record = Session.Installer.CreateRecord( 0 );
	record.StringData( 0 ) = "CustomAction: Exception: " + exc.number.toString(16).toUpperCase() + " : " + exc.message;
	Session.Message(
		MsgKind.Error + Icons.Critical + Buttons.btnOkOnly,
		record
	);
};

// spool an informational message into the MSI log, if it is enabled. 
function LogMessage( msg ) {
	var record = Session.Installer.CreateRecord( 0 );
	record.StringData( 0 ) = msg;
	Session.Message(
		MsgKind.Log,
		record
	);
};

// https://github.com/douglascrockford/JSON-js/blob/master/json2.js
/*
	json2.js
	2014-02-04
*/

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
	'use strict';

	function f(n) {
		// Format integers to have at least two digits.
		return n < 10 ? '0' + n : n;
	}

	if (typeof Date.prototype.toJSON !== 'function') {

		Date.prototype.toJSON = function () {
			return isFinite(this.valueOf())
				? this.getUTCFullYear()     + '-' +
				f(this.getUTCMonth() + 1) + '-' +
				f(this.getUTCDate())      + 'T' +
				f(this.getUTCHours())     + ':' +
				f(this.getUTCMinutes())   + ':' +
				f(this.getUTCSeconds())   + 'Z'
				: null
			;
		};

		String.prototype.toJSON  =
		Number.prototype.toJSON  =
		Boolean.prototype.toJSON = function () {
			return this.valueOf();
		};
	}

	var cx,
		escapable,
		gap,
		indent,
		meta,
		rep;

	function quote(string) {
		escapable.lastIndex = 0;
		return escapable.test(string) ?
			'"' + string.replace(escapable, function (a) {
				var c = meta[a];
				return typeof c === 'string'
				? c
				: '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' 
			: '"' + string + '"'
		;
	}

	function str(key, holder) {
		var i,          // The loop counter.
		k,          // The member key.
		v,          // The member value.
		length,
		mind = gap,
		partial,
		value = holder[key];

		if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}
		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}
		switch (typeof value) {
			case 'string':
				return quote(value);
			case 'number':
				return isFinite(value) ? String(value) : 'null';
			case 'boolean':
			case 'null':
				return String(value);
			case 'object':
				if (!value) {
					return 'null';
				}
				gap += indent;
				partial = [];
				if (Object.prototype.toString.apply(value) === '[object Array]') {
					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}
					v = partial.length === 0
						? '[]'
						: gap
							? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
							: '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}
				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						if (typeof rep[i] === 'string') {
							k = rep[i];
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				} else {
					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}
				v = partial.length === 0
					? '{}'
					: gap
						? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
						: '{' + partial.join(',') + '}';
				gap = mind;
				return v;
		}
	}

	if (typeof JSON.stringify !== 'function') {
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
		meta = {    // table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		};

		JSON.stringify = function (value, replacer, space) {
			var i;
			gap = '';
			indent = '';

			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}
			} else if (typeof space === 'string') {
				indent = space;
			}
			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
				(typeof replacer !== 'object' ||
				typeof replacer.length !== 'number')
			) {
				throw new Error('JSON.stringify');
			}
			return str('', {'': value});
		};
	}

	if (typeof JSON.parse !== 'function') {
		cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
		JSON.parse = function (text, reviver) {
			var j;

			function walk(holder, key) {
				var k, v, value = holder[key];
				if (value && typeof value === 'object') {
					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = walk(value, k);
							if (v !== undefined) {
								value[k] = v;
							} else {
								delete value[k];
							}
						}
					}
				}
				return reviver.call(holder, key, value);
			}

			text = String(text);
			cx.lastIndex = 0;
			if (cx.test(text)) {
				text = text.replace(cx, function (a) {
					return '\\u' +
						('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				});
			}

			if (/^[\],:{}\s]*$/
				.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
				.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
				.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
			) {
				j = eval('(' + text + ')');
				return typeof reviver === 'function'
					? walk({'': j}, '')
					: j;
			}

			throw new SyntaxError('JSON.parse');
		};
	}
}());
