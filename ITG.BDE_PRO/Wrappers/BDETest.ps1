$t = New-Object -ComObject ITG.BDEAdministrator;
$t.Version;

$t.BackupConfigFileAs( 'c:\backup.cfg', $null );

$t.Init( $null );

# $t.ImportODBC( $null );
$t.AddAlias( 'NevaTest3303P', 'Microsoft dBase Driver (*.dbf)', 'DSN:NevaTest3303P;DESCRIPTION:База данных результатов поверок НеваТест 3303П', $null );
# $t.DeleteAlias( 'NevaTest3303P', $null );
$t.SaveConfigFile( $null );

$t.Done( $null );

<#
$t.Init( $null );

# $t.ImportODBC( $null );
# $t.AddAlias( 'NevaTest3303P', 'Microsoft dBase Driver (*.dbf)', 'DSN:NevaTest3303P;DESCRIPTION:База данных результатов поверок НеваТест 3303П', $null );
$t.DeleteAlias( 'NevaTest3303P', $null );
$t.SaveConfigFile( $null );

$t.Done( $null );
#>

[System.Runtime.InteropServices.Marshal]::ReleaseComObject( $t );

$t = New-Object -ComObject ITG.BDEAdministrator;
$t.RestoreConfigFileFrom( 'c:\backup.cfg', $null );
[System.Runtime.InteropServices.Marshal]::ReleaseComObject( $t );
