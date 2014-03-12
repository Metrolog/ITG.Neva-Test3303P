//#region custom actions specific constants

var Messages = {
	msierrBDEError : 26801
};
var uiCost = {
	BDEBackupConfig  : 100000,
	BDERestoreConfig : 100000,
	BDEAddAlias      : 100000,
	BDERemoveAlias   : 100000,
	BDEUsageCount    : 10000
};

//#endregion
//#region BDE UseCount management

// http://msdn.microsoft.com/en-us/library/aa393286.aspx
var RegistryRoot = {
	HKEY_CLASSES_ROOT   : 0x80000000,
	HKEY_CURRENT_USER   : 0x80000001,
	HKEY_LOCAL_MACHINE  : 0x80000002,
	HKEY_USERS          : 0x80000003,
	HKEY_CURRENT_CONFIG : 0x80000005,
	HKEY_DYN_DATA       : 0x80000006
};

var rR = RegistryRoot.HKEY_LOCAL_MACHINE;
var rK = "Software\\Borland\\Database Engine";
var rV = "UseCount";

function IncBDEUsageCount_CA() {
	try {
		DoDeferredAction( "IncBDEUsageCountDeferred", uiCost.BDEUsageCount );
		DoDeferredAction( "IncBDEUsageCountRollback", uiCost.BDEUsageCount );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function IncBDEUsageCountDeferred_CA() {
	try {
		IncBDEUsageCount();
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function IncBDEUsageCountRollback_CA() {
	try {
		DecBDEUsageCount();
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function DecBDEUsageCount_CA() {
	try {
		DoDeferredAction( "DecBDEUsageCountDeferred", uiCost.BDEUsageCount );
		DoDeferredAction( "DecBDEUsageCountRollback", uiCost.BDEUsageCount );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function DecBDEUsageCountDeferred_CA() {
	try {
		DecBDEUsageCount();
		ProgressBar( uiCost.BDEUsageCount );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function DecBDEUsageCountRollback_CA() {
	try {
		IncBDEUsageCount();
		ProgressBar( uiCost.BDEUsageCount );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function IncBDEUsageCount() {
	var objRegistry = GetObject( "winmgmts:\\\\.\\root\\default:StdRegProv" );
	//#region objRegistry.GetDWORDValue( rR, rK, rV, &UseCount );
	var GetDWORDValue = objRegistry.Methods_.Item( "GetDWORDValue" );
	var inParameters = GetDWORDValue.InParameters.SpawnInstance_();
	inParameters.hDefKey = rR;
	inParameters.sSubKeyName = rK;
	inParameters.sValueName = rV;
	var outParameters = objRegistry.ExecMethod_( "GetDWORDValue", inParameters);
	var UseCount = outParameters.uValue;
	//#endregion
	var Before = UseCount;
	if ( null === UseCount ) {
		UseCount = 0;
	};
	var After = UseCount += 1;
	ActionData( Before, After );
	objRegistry.SetDWORDValue( rR, rK, rV, UseCount );
};

function DecBDEUsageCount() {
	var objRegistry = GetObject( "winmgmts:\\\\.\\root\\default:StdRegProv" );
	//#region objRegistry.GetDWORDValue( rR, rK, rV, &UseCount );
	var GetDWORDValue = objRegistry.Methods_.Item( "GetDWORDValue" );
	var inParameters = GetDWORDValue.InParameters.SpawnInstance_();
	inParameters.hDefKey = rR;
	inParameters.sSubKeyName = rK;
	inParameters.sValueName = rV;
	var outParameters = objRegistry.ExecMethod_( "GetDWORDValue", inParameters);
	var UseCount = outParameters.uValue;
	//#endregion
	var Before = UseCount;
	var After;
	if ( null !== UseCount ) {
		After = UseCount -= 1;
		if ( UseCount ) {
			objRegistry.SetDWORDValue( rR, rK, rV, UseCount );
		} else {
			objRegistry.DeleteValue( rR, rK, rV );
		};
	};
	ActionData( Before, After );
};

//#endregion
//#region BDE aliases management

function InstallBDEAliases_CA() {
	try {
		BackupAndRestoreBDEConfig();
		// теперь собственно создание алиасов и прочие необходимые действия по конфигурации
		// ...
		DoDeferredAction( "DoInstallBDEAliases", uiCost.BDEAddAlias );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function BackupAndRestoreBDEConfig() {
	var backupFileName = Session.Property( "BDECONFIGBACKUPFILE" );
	if ( !backupFileName ) {
		var FSO = new ActiveXObject("Scripting.FileSystemObject");
		var backupFileName = FSO.BuildPath(
			FSO.GetSpecialFolder( 2 ),
			FSO.GetTempName()
		);
		DoDeferredAction( "BDEBackupConfig", uiCost.BDEBackupConfig, backupFileName );
		DoDeferredAction( "BDERestoreConfig", uiCost.BDERestoreConfig, backupFileName );
		Session.Property( "BDECONFIGBACKUPFILE" ) = backupFileName;
	};
};

function BDEBackupConfig_CA() {
	// deferred
	try {
		var backupFileName = JSON.parse( Session.Property( "CustomActionData" ) );
		ActionData( backupFileName );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		// LogMessage( "ITG.BDEAdministrator is avaliable." );
		CheckBDEError( BDEAdmin.BackupConfigFileAs( backupFileName ) );
		ProgressBar( uiCost.BDEBackupConfig );
		// LogMessage( "BDE configuration was successfully backuped." );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function BDERestoreConfig_CA() {
	// rollback
	try {
		var backupFileName = JSON.parse( Session.Property( "CustomActionData" ) );
		ActionData( backupFileName );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		// LogMessage( "ITG.BDEAdministrator is avaliable." );
		CheckBDEError( BDEAdmin.RestoreConfigFileFrom( backupFileName ) );
		ProgressBar( uiCost.BDERestoreConfig );
		// LogMessage( "BDE configuration was successfully restored." );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function DoInstallBDEAliases_CA() {
	// deferred
	try {
		var record = Session.Installer.CreateRecord( 1 );
		for ( var i = 0; i < 5; i++ ) {
			record.StringData( 0 ) = "test" + i;
			Session.Message(
				MsgKind.User + Icons.Information + Buttons.btnOkOnly,
				record
			);
			ProgressBar( uiCost.BDEAddAlias / 5 );
		};
		/*
		LogMessage( "Attempt to register new BDE alias..." );
		var data = Session.Property( "CustomActionData" );
		LogMessage( "Parameters " + data );
		var Params = JSON.parse( data );
		LogMessage( "Alias name        : " + Params.DataSource );
		LogMessage( "Alias driver      : " + Params.DriverDescription );
		LogMessage( "Alias description : " + Params.Description );
		LogMessage( "Alias parameters  : " + Params.Parameters );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		CheckBDEError( BDEAdmin.Init() );
		LogMessage( "ITG.BDEAdministrator is successfully initialized." );
		CheckBDEError( BDEAdmin.AddAlias(
			Params.DataSource,
			Params.DriverDescription,
			Params.Parameters
		) );
		CheckBDEError( BDEAdmin.SaveConfigFile() );
		LogMessage( "BDE configuration is successfully saved." );
		CheckBDEError( BDEAdmin.Done() );
		LogMessage( "BDE alias was successfully added." );
		*/
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function RemoveBDEAliases_CA() {
	try {
		BackupAndRestoreBDEConfig();
		// теперь собственно удаление алиасов и прочие необходимые действия по конфигурации
		// ...
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

function DoRemoveBDEAliases_CA() {
	// deferred
	try {
		LogMessage( "Attempt to delete BDE alias..." );
		var data = Session.Property( "CustomActionData" );
		LogMessage( "Parameters " + data );
		var Params = JSON.parse( data );
		LogMessage( "Alias name        : " + Params.DataSource );
		var BDEAdmin = new ActiveXObject( "ITG.BDEAdministrator" );
		CheckBDEError( BDEAdmin.Init() );
		LogMessage( "ITG.BDEAdministrator is successfully initialized." );
		CheckBDEError( BDEAdmin.DeleteAlias(
			Params.DataSource
		) );
		CheckBDEError( BDEAdmin.SaveConfigFile() );
		LogMessage( "BDE configuration is successfully saved." );
		CheckBDEError( BDEAdmin.Done() );
		LogMessage( "BDE alias was successfully deleted." );
	} catch ( exc ) {
		return CheckException( exc );
	}
	return MsiActionStatus.Ok;
};

// Check BDE error code, register error in log and throw exception
function CheckBDEError( BDEResult ) {
	if ( 0 != BDEResult ) {
		ErrorMessage( Messages.msierrBDEError, BDEResult, Icons.Critical + Buttons.btnOkOnly );
		throw new Error( BDEResult );
	};
};

//#endregion
//#region common MSI wrappers

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
	FatalExit        : 0x00000000, // premature termination, possibly fatal OOM
	Error            : 0x01000000, // formatted error message
	Warning          : 0x02000000, // formatted warning message
	User             : 0x03000000, // user request message
	Log              : 0x04000000, // informative message for log
	FilesInUse       : 0x05000000, // list of files in use that need to be replaced
	ResolveSource    : 0x06000000, // request to determine a valid source location
	OutOfDiskSpace   : 0x07000000, // insufficient disk space message
	ActionStart      : 0x08000000, // start of action: action name & description
	ActionData       : 0x09000000, // formatted data associated with individual action item
	Progress         : 0x0A000000, // progress gauge info: units so far, total
	CommonData       : 0x0B000000, // product info for dialog: language Id, dialog caption
	Initialize       : 0x0C000000, // sent prior to UI initialization, no string data
	Terminate        : 0x0D000000, // sent after UI termination, no string data
	ShowDialog       : 0x0E000000  // sent prior to display or authored dialog or wizard
};

// http://msdn.microsoft.com/en-us/library/aa371254(VS.85).aspx
var MsiActionStatus = {
	Error            :-1,
	None             : 0,  // msiDoActionStatusNoAction
	Ok               : 1,  // msiDoActionStatusSuccess
	Cancel           : 2,  // msiDoActionStatusUserExit
	Abort            : 3,  // msiDoActionStatusFailure
	Retry            : 4,  // msiDoActionStatusSuspend
	Ignore           : 5,  // msiDoActionStatusFinished
	Yes              : 6,
	No               : 7
};

//
var RunMode = { 
	Admin            : 0,  // Administrative mode install, else product install.
	Advertise        : 1,  // Advertise mode of install.
	Maintenance      : 2,  // Maintenance mode database loaded.
	RollbackEnabled  : 3,  // Rollback is enabled.
	LogEnabled       : 4,  // Log file is active.
	Operations       : 5,  // Executing or spooling operations.
	RebootAtEnd      : 6,  // Reboot is needed (settable).
	RebootNow        : 7,  // Reboot is needed to continue installation (settable).
	Cabinet          : 8,  // Installing files from cabinets and files using Media table.
	SourceShortNames : 9,  // Source files use only short file names.
	TargetShortNames : 10, // Target files are to use only short file names.
	Windows9x        : 12, // Operating system is Windows 98/95.
	ZawEnabled       : 13, // Operating system supports advertising of products.
	Scheduled        : 16, // Deferred custom action called from install script execution.
	Rollback         : 17, // Deferred custom action called from rollback execution script.
	Commit           : 18  // Deferred custom action called from commit execution script.
};

function BreakOnUserCancel(
	/* MsiActionStatus */ ret
) {
	if (
		( MsiActionStatus.Abort == ret )
		|| ( MsiActionStatus.Cancel == ret )
	) {
		throw MsiActionStatus.Cancel;
	};
};

// spool an informational message into the MSI log, if it is enabled. 
function MessageEx(
	/* __in int     */ iError,  // id in Error table - http://msdn.microsoft.com/en-us/library/aa372835(v=vs.85).aspx
	/* __in HRESULT */ hrError,
	/* __in UINT    */ uiType   // Buttons || Icons || MsgKind
) {
	if ( typeof hrError === 'undefined' ) { hrError = MsiActionStatus.None };
	if ( typeof uiType  === 'undefined' ) { uiType  = MsgKind.Log };
	var cArgs = arguments.length - 3;
	if ( cArgs < 0 ) { cArgs = 0 };
	var record = Session.Installer.CreateRecord( cArgs + 2 );
	record.IntegerData( 1 ) = iError;
	record.IntegerData( 2 ) = hrError;
	var i = 0;
	for ( i = 0; i < cArgs; i++ ) {
		record.StringData( i+3 ) = arguments[i+3];
	};
	return Session.Message( uiType, record );
};

// spool an error message into the MSI log and pop up it, if it is enabled. 
function ErrorMessage(
	/* __in int     */ iError,  // id in Error table - http://msdn.microsoft.com/en-us/library/aa372835(v=vs.85).aspx
	/* __in HRESULT */ hrError,
	/* __in UINT    */ uiType   // Buttons || Icons || MsgKind
) {
	/* hrError */ if ( typeof hrError === 'undefined' ) { arguments[ 1 ] = MsiActionStatus.Abort };
	/* uiType  */ arguments[ 2 ] |= MsgKind.Error;    // ensure error type is set
	return MessageEx.apply( Session, arguments );
};

// spool an informational message into the MSI log, if it is enabled. 
function LogMessage(
	msg
) {
	var record = Session.Installer.CreateRecord( 0 );
	record.StringData( 0 ) = msg;
	Session.Message( MsgKind.Log, record );
};

// spool an detailed action data into the MSI log, if it is enabled. 
function ActionData(
	/* data */
) {
	var cArgs = arguments.length;
	var record = Session.Installer.CreateRecord( cArgs );
	var i;
	for ( i = 0; i < cArgs; i++ ) {
		switch( typeof arguments[i] ) { 
			case 'integer':
				record.IntegerData( i+1 ) = arguments[i];
				break;
			case 'string':
				record.StringData( i+1 ) = arguments[i];
				break;
			case 'object':
			default:
				record.StringData( i+1 ) = JSON.stringify( arguments[i] );
				break;
		};
	};
	Session.Message( MsgKind.ActionData, record );
};

function UseExplicitProgressMessages() {
	// tell Darwin to use explicit progress messages
	var record = Session.Installer.CreateRecord( 3 );
	record.IntegerData( 1 ) = 1;
	record.IntegerData( 2 ) = 1;
	record.IntegerData( 3 ) = 0;
	Session.Message( MsgKind.Progress, record );
	UseExplicitProgressMessages = function () {};
};

// Extends the progress bar or sends a progress update from the CustomAction
function ProgressMessage(
	/* __in UINT    */ uiCost,
	/* __in BOOL    */ fExtendProgressBar
) {
	if ( ! fExtendProgressBar ) { UseExplicitProgressMessages(); };
	var record = Session.Installer.CreateRecord( 3 );
	record.IntegerData( 1 ) = ( fExtendProgressBar ) ? 3 : 2;
	record.IntegerData( 2 ) = uiCost;
	record.IntegerData( 3 ) = 0; // do not increment for each ActionData message
	BreakOnUserCancel( Session.Message( MsgKind.Progress, record ) );
};

function ExtendProgressBar(
	/* __in UINT    */ uiCost
) {
	ProgressMessage( uiCost, true );
};

function ProgressBar(
	/* __in UINT    */ uiCost
) {
	ProgressMessage( uiCost, false );
};

function DoDeferredAction(
	/* __in_z LPCWSTR */ Action,
	/* __in UINT      */ uiCost,
	/* __in objects[] */ CustomActionData
) {
	if ( ( null != CustomActionData ) && ( undefined !== CustomActionData ) ) {
		Session.Property( Action ) = JSON.stringify( CustomActionData );
	};
	if ( 0 < uiCost ) {
		ExtendProgressBar( uiCost );
	};
	BreakOnUserCancel( Session.DoAction( Action ) );
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

// Pop a message box. Also spool a message into the MSI log, if it is enabled. 
function LogExceptionEx(
	/* __in HRESULT */ hrError,
	/* __in int     */ iError  // id in Error table - http://msdn.microsoft.com/en-us/library/aa372835(v=vs.85).aspx
) {
	if ( typeof iError === 'undefined' ) { iError = 5 }; // internal error
	ErrorMessage( iError, hrError, Icons.Critical + Buttons.btnOkOnly );
};

// For not a Cancel exception pop a message box. Also spool a message into the MSI log, if it is enabled. 
function CheckException( exc ) {
	if ( MsiActionStatus.Cancel === exc ) {
		ErrorMessage( 2322 ); // error code "User canceled"
		return MsiActionStatus.Cancel;
	} else {
		if ( 'Error' === exc.name ) {
			// ошибка сгенерирована программно, выводить в журнал повторно сообщение нет необходимости
		} else {
			LogException ( exc );
			// ErrorMessage( 5, exc.number, Icons.Critical + Buttons.btnOkOnly, exc.message, exc.description ); // internal error
		};
		return MsiActionStatus.Error;
	}; 
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

//#endregion