const fs = require("fs");
const fsPromise = require("fs/promises");
const pdf = require("pdf-parse");
const path = require("path");
const mammoth = require("mammoth");
const jsonexport = require("jsonexport");
const xlsx = require("node-xlsx")
const Stream = require('stream');
// const PPTX2Json = require('pptx2json')
const JSZip = require('jszip')
// var textract = require('textract');
// var Tesseract = require('tesseract.js')
// const checkRelationshipsForFile = require('./checkRelationshipsForFile')
const checkRelationships = require('./checkRelationships')
const { DOMParser } = require('xmldom')

const getDirRecursive = async (dir) => {
    try {
        const items = await fsPromise.readdir(dir);

        // const regex = /\bADA\b|\bEMAIL SIGNATURE POLICY\b|\bemail policy/gmi
        // const regex = /\bthe/gmi
        let files = [];

        const pushToFiles = (matches, item, ext, url, numberOfMatches) => {
            var stats = fs.statSync(`${dir}`)
            var birthtime = stats.birthtime
            var modified = stats.mtime
            if (matches.length) {
                files.push({
                    FILE: item,
                    // PATH: `${dir}/${item}`,
                    URL: url,
                    FILE_TYPE: ext,
                    KEYWORD_MATCHES: matches,
                    NUMBER_OF_MATCHES: numberOfMatches.length,
                    ROOT_FOLDER: dir.split("/")[2],
                    CREATION_DATE: birthtime,
                    MODIFIED_DATE: modified
                })
            }
            console.log(files)
        }



        for (const item of items) {
            const ext = item.split(".").pop();
            const filePath = `${dir}/${item}`
            const url = `https://www.tamuk.edu/${dir.split('wwwroot/').pop()}/${item}`
            if ((await fsPromise.lstat(filePath)).isDirectory())
                files = [...files, ...(await getDirRecursive(filePath))];

            else if (fileExt.some((x) => ext.includes(x))) {

                await fsPromise.lstat(filePath).then(async res => {

                    if (res.size > 0) {


                        if (ext === 'pptx') {

                            function getTextFromNodes(node, tagName, namespaceURI) {
                                let text = '';
                                const textNodes = node.getElementsByTagNameNS(namespaceURI, tagName);
                                for (let i = 0; i < textNodes.length; i++) {
                                    text += textNodes[i].textContent + ' ';
                                }
                                return text.trim();
                            }

                            async function getTextFromPPTX(arrayBuffer) {

                                try {
                                    const zip = new JSZip()
                                    await zip.loadAsync(arrayBuffer)

                                    const aNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
                                    let text = '';

                                    let slideIndex = 1;

                                    while (true) {
                                        const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);

                                        if (!slideFile) break;

                                        const slideXmlStr = await slideFile.async('text');

                                        const parser = new DOMParser();
                                        const xmlDoc = parser.parseFromString(slideXmlStr, 'application/xml');

                                        text += getTextFromNodes(xmlDoc, "t", aNamespace) + ' ';

                                        slideIndex++;
                                    }
                                    // console.log(item)
                                    const value = text.toLowerCase()
                                    const keywordMatches = [...new Set(value.match(regex))]
                                    const numberOfMatches = value.match(regex)
                                    pushToFiles(keywordMatches, item, ext, url, numberOfMatches)

                                    // return (['the'], 'testing.pptx', '.doc', 'www.tamuk.edu', '2')
                                    // return keywordMatches, item, ext, url, numberOfMatches
                                }
                                catch (e) {
                                    console.error(e)
                                }

                            }
                            // pushToFiles(['the'], 'testing.pptx', '.doc', 'www.tamuk.edu', '2')

                            fs.readFile(filePath, function (err, data) {
                                if (err) throw err;

                                getTextFromPPTX(data)
                            });


                        }

                        // if (ext === "html") {
                        //     if (!filePath.includes('news')) {
                        //         let value = String(fs.readFileSync(filePath, "utf-8")).toLowerCase();
                        //         let html = fs.readFileSync(filePath, "utf-8")
                        //         let titleRegExp = /(?<=<title>)(.*?)(?=<\/title>)/gis
                        //         let title = html.match(titleRegExp)
                        //         title = String(title).replace(/\s{2,}/g, "").replace('&amp;','&')
                        //         const keywordMatches = [...new Set(value.match(regex))]
                        //         const numberOfMatches = value.match(regex)
                        //         pushToFiles(keywordMatches, title, ext, url, numberOfMatches)
                        //     }
                        // }
                        if (ext === "docx") {
                            await mammoth.extractRawText({ path: filePath }).then((res) => {
                                const value = String(res.value).toLowerCase()
                                const keywordMatches = [...new Set(value.match(regex))]
                                const numberOfMatches = value.match(regex)
                                pushToFiles(keywordMatches, item, ext, url, numberOfMatches)
                            })
                                .catch((e) => {
                                    console.log(e)
                                })
                        }
                        // if (ext === "png" | ext === "jpg" | ext === "jpeg" | ext === "tiff") {
                        //     await Tesseract.recognize(
                        //         filePath,
                        //         'eng',
                        //         // { logger: m => console.log(m) }
                        //     ).then(({ data }) => {
                        //         new Promise(function (resolve, reject) {
                        //             try {
                        //                 const value = String(data.text).toLowerCase()
                        //                 const keywordMatches = [...new Set(value.match(regex))]
                        //                 const numberOfMatches = value.match(regex)
                        //                 // console.log(numberOfMatches)
                        //                 pushToFiles(keywordMatches, item, ext, url, numberOfMatches)
                        //                 resolve()
                        //             } catch (e) {
                        //                 console.log(`${e} ${reject}`)
                        //             }
                        //         })
                        //     })
                        // }

                        // else if (ext === "pdf") {
                        //     let dataBuffer = fs.readFileSync(filePath);
                        //     await pdf(dataBuffer).then((res) => {
                        //         const value = String(res.text).toLowerCase()
                        //         const keywordMatches = [...new Set(value.match(regex))]
                        //         const numberOfMatches = value.match(regex)
                        //         pushToFiles(keywordMatches, item, ext, url, numberOfMatches)
                        //     })
                        //         .catch((e) => {
                        //             // console.log(`${e.message} on file ${filePath}`)
                        //         })
                        // }



                        // else if (ext === "txt" || ext === "doc") {
                        //     let value = fs.readFileSync(filePath, "utf-8");
                        //     const keywordMatches = [...new Set(value.match(regex))]
                        //     const numberOfMatches = value.match(regex)
                        //     pushToFiles(keywordMatches, item, ext, url, numberOfMatches)
                        // }
                        // else if (ext === "xlsx" || ext === "xls") {
                        //     const workSheetsFromFile = xlsx.parse(filePath)[0].data;
                        //     const value = String(workSheetsFromFile.join()).toLowerCase()
                        //     const keywordMatches = [...new Set(value.match(regex))]
                        //     const numberOfMatches = value.match(regex)
                        //     pushToFiles(keywordMatches, item, ext, url, numberOfMatches)
                        // }


                        // if(ext === 'pptx') {
                        //     fs.readFile(filePath, function (err, data) {
                        //         if (err) throw err;
                        //         JSZip.loadAsync(data).then(function (zip) {
                        //             const buf = zip.file('ppt/slides/slide1.xml')
                        //             console.log(buf)
                        //             async function getContentReadStream(readable) {
                        //                 for await (const chunk of readable) {
                        //                     console.log(chunk);
                        //                     console.log(chunk.toString());
                        //                 }
                        //             }

                        //             getContentReadStream(zip);
                        //         });
                        //     });

                        // }
                        // else if (ext !== 'pptx') {
                        // await new Promise(function (resolve, reject) {
                        //     try {
                        //         textract.fromFileWithPath(filePath, (error, text) => {
                        //             if (error) console.log(error)
                        //             const value = String(text).toLowerCase()
                        //             const keywordMatches = [...new Set(value.match(regex))]
                        //             const numberOfMatches = value.match(regex)
                        //             console.log(item)
                        //             pushToFiles(keywordMatches, item, ext, url, numberOfMatches)
                        //             resolve()
                        //         })
                        //     } catch (e) {
                        //         console.log(`${e} ${reject}`)
                        //     }
                        // })
                        // }
                    }
                })
            }
        }
        return files;
    } catch (e) {
        return e;
    }
};

const directoryPath = 'D:/wwwroot/digitalsignage'
const fileExt = ["pdf", "docx", "txt", "doc", "xls", "xlsx", "pptx", "jpg", "jpeg", "png", "tiff", "html"];
const regex = /\bthe/gmi;
// const regex = /\bDiversity\b|\bEquity\b|\bInclusion\b|Diversity, Equity, Inclusion and Access/gmi;

getDirRecursive(directoryPath).then((files) => {
    jsonexport(files, function (err, csv) {

        if (err) {
            return console.log(err);
        } else {
            fs.writeFile("exports/test-run.csv", csv, (err) => {
                if (err) return console.log(err);
                console.log("file created!");
            })

            // checkRelationshipsForFile(files, directoryPath)
            // checkRelationships(files,directoryPath)
        }

    })

})

