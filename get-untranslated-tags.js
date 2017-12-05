#!/usr/bin/env node
var fs = require('fs');
var json2csv = require('json2csv');

var argv = require('yargs')
	.option('p', {
		alias : 'path',
		demand: true,
		describe: 'please specify a path',
		type: 'string'
	})
	.option('f', {
		alias : 'file',
		demand: false,
		describe: 'please specify a file',
		type: 'string'
	})
	.argv
;

var filePath = (argv.p[argv.p.length-1] != '/') ? (argv.p + '/') : (argv.p);
var untranslatedString = [];
var csvFields = ['stringID'];

function differ(fileName){
	var Languages = function(){csvFields.map((lang) => {this[lang] = '--';})}

	if(fileName.indexOf('EN') !== -1) return false;

	fs.readFile(filePath + fileName, 'utf8', (err, targetData) => {
		var curLang = fileName.split('.')[0];
		csvFields.push(curLang);

		fs.readFile(filePath + "EN.dict", 'utf8', (err, goldenData) => {
			targetData.split(/\r?\n/).map((line) => {
				if(goldenData.indexOf(line) !== -1){
					var strId = line.split('=')[0];

					if(untranslatedString.indexOf(strId) == -1){
						untranslatedString.push(strId);
						untranslatedString[strId] = new Languages();
						untranslatedString[strId].stringID = strId;
					}

					untranslatedString[strId][curLang] = line.replace(strId + '=', '');
				}
			});

			// convert json data to CSV
			var untranslatedStringToCsv = [];
			untranslatedString
				.filter((strId) => {
					return (
						strId.indexOf('TZ') === -1 && 
						strId.indexOf('Yandex') === -1 && 
						strId.indexOf('WLANConfig11b') === -1 && 
						strId.indexOf('CTL_ok') === -1 && 
						strId.indexOf('CHAR_set') === -1 && 
						strId.indexOf('menu5') === -1 && 
						strId !== ''
					)
				})
				.map((strId) => {
					untranslatedStringToCsv.push(untranslatedString[strId])
				})

			var csv = json2csv({ data: untranslatedStringToCsv, fields: csvFields });
			fs.writeFile(filePath + 'untranslated_strings.csv', csv, function(err) {});
		});
	});
}

if(!argv.f){
	fs.readdir(filePath, (err, files) => {
		files.forEach(differ);
	});
}
else{
	differ(argv.f);
}
