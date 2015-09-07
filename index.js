var notifier = require('node-notifier')
var path = require('path')
var exec = require('child_process').exec

var pid = null
var lastName = ""

function getPID() {
	exec('tasklist -V -FO CSV -FI "IMAGENAME eq spotify.exe"', function(error, stdout, stderr) {
		stdout.split('\r\n').forEach(function(line, index){
			var processInfo = line.split('",')
			if (index === 0 || processInfo.length < 9) {
				return true
			}
			if (processInfo[8] === '"AngleHiddenWindow"' || processInfo[8] === '"OleMainThreadWndName"') {
				return true
			}
			pid = processInfo[1].substr(1)
		})

		if (pid) {
			console.log('Spotify PID: '+pid)
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
		stdout.split('\r\n').forEach(function(line, index){
			var processInfo = line.split('",')
			if (index === 0 || processInfo.length < 9) {
				return true
			}
			var name = processInfo[8].substr(1, processInfo[8].length - 2)
			if (lastName !== name && name !== 'Spotify' && name !== 'N/A') {
				console.log(name)
				notifier.notify({
					'title': 'Spotify',
					'message': name,
					'icon': path.join(__dirname, 'logo.png')
				});
				lastName = name
			}
		})

		setTimeout(function(){
			watchChange()
		}, 750)
	})
}



getPID()
