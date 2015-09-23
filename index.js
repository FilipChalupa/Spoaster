var notifier = require('node-notifier')
var path = require('path')
var exec = require('child_process').exec

var pid
var lastName
var DEBUG = false

if (process.argv.indexOf('-h') !== -1 || process.argv.indexOf('--help') !== -1) {
	console.log('Usage: program.exe [-h | -v]')
	return 0
}

if (process.argv.indexOf('-v') !== -1 || process.argv.indexOf('--version') !== -1) {
	var info = require('./package')
	console.log(info.version)
	return 0
}

if (process.argv.indexOf('-d') !== -1 || process.argv.indexOf('--debug') !== -1) {
	DEBUG = true
	debugLog('Debug mode\n')
}

function debugLog(text) {
	if (DEBUG) {
		console.log(text)
	}
}

function resetState() {
	pid = null
	lastName = ""
}

function removeQuotes(text) {
	return text.substr(1, text.length - 2)
}


function getPID() {
	exec('tasklist -V -FO CSV -FI "IMAGENAME eq spotify.exe"', function(error, stdout, stderr) {
		stdout.split('\r\n').forEach(function(line, index){
			var processInfo = removeQuotes(line).split('","')
			if (index === 0 || processInfo.length < 9) {
				return true
			}
			var name = processInfo[8]
			if (name === 'AngleHiddenWindow' || name === 'OleMainThreadWndName') {
				return true
			}
			pid = processInfo[1]
			return false
		})

		if (pid) {
			debugLog('\nSpotify PID: '+pid+'\n')
			watchChange()
		} else {
			setTimeout(function(){
				getPID()
			}, 750)
		}
	})
}


function watchChange() {
	exec('tasklist -V -FO CSV -FI "PID eq '+pid+'"', function(error, stdout, stderr) {
		var spotifyClosed = true
		stdout.split('\r\n').forEach(function(line, index){
			var processInfo = removeQuotes(line).split('","')
			if (index === 0 || processInfo.length < 9) {
				return true
			}
			spotifyClosed = false
			var name = processInfo[8]
			if (name === 'Spotify' || name === 'Drag' || name === 'N/A') {
				debugLog('Ignore: '+name)
			} else if (lastName !== name) {
				debugLog('Now playing: "'+name+'"')
				notifier.notify({
					'title': 'Spotify',
					'message': name,
					'icon': path.join(__dirname, 'logo.png')
				});
				lastName = name
			}
		})

		if (spotifyClosed) {
			debugLog('\nSpotify is closed.\nWait for new PID.')
			resetState()
			getPID()
		} else {
			setTimeout(function(){
				watchChange()
			}, 750)
		}
	})
}



getPID()
