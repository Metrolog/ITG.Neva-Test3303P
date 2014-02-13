// http://stackoverflow.com/questions/471424/wix-tricks-and-tips

function IncBDEUsageCount_CA() {
	try {
		LogMessage( "Attempt to schedule 'UseCount' registry value 'inc' operations..." );
		Session.DoAction( "IncBDEUsageCountDeferred" );
		Session.DoAction( "IncBDEUsageCountRollback" );
		LogMessage( "UseCount registry value operations was scheduled successfully." );
	} catch ( e ) {
		LogException( e );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function IncBDEUsageCountDeferred_CA() {
	return IncBDEUsageCount();
};

function IncBDEUsageCountRollback_CA() {
	return DecBDEUsageCount();
};

function DecBDEUsageCount_CA() {
	try {
		LogMessage( "Attempt to schedule 'UseCount' registry value 'dec' operations..." );
		Session.DoAction( "DecBDEUsageCountDeferred" );
		Session.DoAction( "DecBDEUsageCountRollback" );
		LogMessage( "UseCount registry value operations was scheduled successfully." );
	} catch ( e ) {
		LogException( e );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function DecBDEUsageCountDeferred_CA() {
	return DecBDEUsageCount();
};

function DecBDEUsageCountRollback_CA() {
	return IncBDEUsageCount();
};

function IncBDEUsageCount() {
	try {
		LogMessage( "Attempt to increment UseCount registry value for BDE..." );

		var objRegistry = GetObject( "winmgmts:\\\\.\\root\\default:StdRegProv" );

		// objRegistry.GetDWORDValue( rR, rK, rV, &UseCount );
		var GetDWORDValue = objRegistry.Methods_.Item( "GetDWORDValue" );
		var inParameters = GetDWORDValue.InParameters.SpawnInstance_();
		inParameters.hDefKey = rR;
		inParameters.sSubKeyName = rK;
		inParameters.sValueName = rV;
		var outParameters = objRegistry.ExecMethod_( "GetDWORDValue", inParameters);
		var UseCount = outParameters.uValue;
		if ( null == UseCount ) {
			UseCount = 0;
			LogMessage( "UseCount registry value doesn't exists." );
		} else {
			LogMessage( "Current UseCount value == " + UseCount );
		};
		UseCount = UseCount + 1;
		objRegistry.SetDWORDValue( rR, rK, rV, UseCount );

		LogMessage( "UseCount registry value was incremented successfully, new value == " + UseCount );
	} catch ( e ) {
		LogException( e );
		return MsiActionStatus.Abort;
	}
	return MsiActionStatus.Ok;
};

function DecBDEUsageCount() {
	try {
		LogMessage( "Attempt to decrement UseCount registry value for BDE..." );

		var objRegistry = GetObject( "winmgmts:\\\\.\\root\\default:StdRegProv" );

		// objRegistry.GetDWORDValue( rR, rK, rV, &UseCount );
		var GetDWORDValue = objRegistry.Methods_.Item( "GetDWORDValue" );
		var inParameters = GetDWORDValue.InParameters.SpawnInstance_();
		inParameters.hDefKey = rR;
		inParameters.sSubKeyName = rK;
		inParameters.sValueName = rV;
		var outParameters = objRegistry.ExecMethod_( "GetDWORDValue", inParameters);
		var UseCount = outParameters.uValue;
		if ( null == UseCount ) {
			LogMessage( "UseCount registry value already doesn't exists." );
		} else {
			LogMessage( "Current UseCount value == " + UseCount );
			UseCount = UseCount - 1;
			if ( UseCount ) {
				objRegistry.SetDWORDValue( rR, rK, rV, UseCount );
			} else {
				LogMessage( "Attempt to delete UseCount registry value." );
				objRegistry.DeleteValue( rR, rK, rV );
			};
		};

		LogMessage( "UseCount registry value was decremented successfully, new value == " + UseCount );
	} catch ( e ) {
		LogException( e );
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

// Pop a message box. Also spool a message into the MSI log, if it is enabled. 
function LogException( exc ) {
    var record = Session.Installer.CreateRecord( 0 );
    record.StringData( 0 ) = "CustomAction: Exception: 0x" + exc.number.toString(16).toUpperCase() + " : " + exc.message;
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