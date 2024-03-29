const fs = require('fs');
const path = require('path');
const jsonexport = require("jsonexport");

function findFilesWithExtensions(directoryPath, extensions, callback) {
    let fileArrays = {};
    extensions.forEach(extension => {
        fileArrays[extension] = [];
    });

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return callback(err);
        }

        let pending = files.length;
        if (!pending) {
            return callback(null, fileArrays);
        }

        files.forEach(file => {
            const filePath = path.join(directoryPath, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    return callback(err);
                }

                if (stats.isDirectory()) {
                    findFilesWithExtensions(filePath, extensions, (err, subArrays) => {
                        Object.keys(subArrays).forEach(extension => {
                            fileArrays[extension] = fileArrays[extension].concat(subArrays[extension]);
                        });
                        if (!--pending) callback(null, fileArrays);
                    });
                } else {
                    const fileExtension = path.extname(filePath).toLowerCase();
                    if (extensions.includes(fileExtension)) {
                        fileArrays[fileExtension].push(filePath);
                    }
                    if (!--pending) callback(null, fileArrays);
                }
            });
        });
    });
}
function checkRelationships(keywordMatches,directoryPath){

    // Example usage
    const extensions = ['.html', '.pdf', '.docx', '.doc'];
    findFilesWithExtensions(directoryPath, extensions, (err, fileArrays) => {
        if (err) {
            console.error(err);
        } else {
            const relationships = []
            const noRelationships = []
            // console.log(fileArrays['.html'])
            keywordMatches.forEach(match=>{
                if(fileArrays['.html']){
                    let count = 0
                    fileArrays['.html'].forEach(page=>{
                        let html = fs.readFileSync(page, "utf-8")
                        if(html.includes(match.FILE)){
                           relationships.push({
                               FILE: match.FILE,
                               URL: match.URL,
                               Relationship: page,
                           })
                           count++
                        }
                    })
                    if (count === 0) {
                        noRelationships.push({
                            FILE: match.FILE,
                            URL: match.URL,
                        })
                    }
                }
            })

            jsonexport(relationships, function (err, csv) {
                if (err) {
                    console.log(err)
                } else {
                    fs.writeFile('exports/relationships.csv', csv, (err) => {
                        if (err) console.log(err)
                        console.log('relationships file created!')
                    })
                }
            })

            jsonexport(noRelationships, function (err, csv) {
                if (err) {
                    console.log(err)
                } else {
                    fs.writeFile('exports/no-relationships.csv', csv, (err) => {
                        if (err) console.log(err)
                        console.log('no relationships file created!')
                    })
                }
            })

        }
    });
    
}

module.exports = checkRelationships
