/*  by Naufal Taufiq Ridwan
    Github : https://github.com/n0l3r
    Don't remove credit.
*/

const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs");
const { chromium } = require("playwright");
const { exit } = require("process");
const readline = require("readline");

inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

//adding useragent to avoid ip bans
const headers = new Headers();

const getChoice = () =>
    new Promise((resolve, reject) => {
        inquirer
            .prompt([
                {
                    type: "list",
                    name: "choice",
                    message: "Choose a option",
                    choices: [
                        "Mass Download (Username)",
                        "Mass Download with (txt)",
                        "Single Download (URL)",
                    ],
                },
                {
                    type: "list",
                    name: "type",
                    message: "Choose a option",
                    choices: ["With Watermark", "Without Watermark"],
                },
            ])
            .then((res) => resolve(res))
            .catch((err) => reject(err));
    });

const getInput = (message) =>
    new Promise((resolve, reject) => {
        inquirer
            .prompt([
                {
                    type: "input",
                    name: "input",
                    message: message,
                },
            ])
            .then((res) => {
                // Split input by comma and trim each URL
                const urls = res.input.split(",").map((url) => url.trim());
                resolve(urls);
            })
            .catch((err) => reject(err));
    });

const generateUrlProfile = (username) => {
    var baseUrl = "https://www.tiktok.com/";
    
    if (username.includes("@")) {
        baseUrl = `${baseUrl}${username}`;
    } else {
        baseUrl = `${baseUrl}@${username}`;
    }
    return baseUrl;
};

const downloadMedia = async (item) => {
    const folder = "downloads/";
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    
    // check for slideshow
    if (item.images.length != 0) {
        console.log(chalk.green("[*] Downloading Slideshow"));

        let index = 0;
        for (const image_url of item.images) {
            const fileName = `${item.id}_${index}.jpeg`;
            // check if file was already downloaded
            if (fs.existsSync(folder + fileName)) {
                console.log(
                    chalk.yellow(
                        `[!] File '${fileName}' already exists. Skipping`
                    )
                );
                index++;
                continue;
            }
            index++;
            
            const response = await fetch(image_url);
            const fileStream = fs.createWriteStream(folder + fileName);
            
            const reader = response.body.getReader();
            
            const stream = new ReadableStream({
                async start(controller) {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            break;
                        }
                        
                        controller.enqueue(value);
                    }
                    controller.close();
                }
            });

            const nodeStream = stream.pipeTo(new WritableStream({
                write(chunk) {
                    fileStream.write(chunk);
                }
            }));
            
            await nodeStream;
            fileStream.end();
        }
    } else {
        const fileName = `${item.id}.mp4`;
        // check if file was already downloaded
        if (fs.existsSync(folder + fileName)) {
            console.log(
                chalk.yellow(`[!] File '${fileName}' already exists. Skipping`)
            );
            return;
        }
        const response = await fetch(item.url);
        const fileStream = fs.createWriteStream(folder + fileName);

        const reader = response.body.getReader();

        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    controller.enqueue(value);
                }
                controller.close();
            }
        });
        
        const nodeStream = stream.pipeTo(new WritableStream({
            write(chunk) {
                fileStream.write(chunk);
            }
        }));
        
        await nodeStream;
        fileStream.end();
    }
};

// url contains the url, watermark is a bool that tells us what link to use
const getVideo = async (url, watermark) => {
    const idVideo = await getIdVideo(url);
    const API_URL = `https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/?aweme_id=${idVideo}&iid=7318518857994389254&device_id=7318517321748022790&channel=googleplay&app_name=musical_ly&version_code=300904&device_platform=android&device_type=ASUS_Z01QD&version=9`;
    
    const request = await fetch(API_URL, {
        method: "OPTIONS",
        headers: headers,
    });
    
    const body = await request.text();
    
    try {
        var res = JSON.parse(body);
    } catch (err) {
        console.error("Error:", err);
        console.error("Response body:", body);    
    }
    
    // check if video was deleted
    if (res.aweme_list[0].aweme_id != idVideo) {
        return null;
    }
    
    let urlMedia = "";
    
    let image_urls = [];
    
    // check if video is slideshow
    if (!!res.aweme_list[0].image_post_info) {
        console.log(chalk.green("[*] Video is slideshow"));
        
        // get all image urls
        res.aweme_list[0].image_post_info.images.forEach((element) => {
            // url_list[0] contains a webp
            // url_list[1] contains a jpeg
            image_urls.push(element.display_image.url_list[1]);
        });
    } else {
        // download_addr vs play_addr
        urlMedia = watermark
            ? res.aweme_list[0].video.download_addr.url_list[0]
            : res.aweme_list[0].video.play_addr.url_list[0];
    }
    
    const data = {
        url: urlMedia,
        images: image_urls,
        id: idVideo,
    };
    
    return data;
};

const getListVideoByUsername = async (username) => {
    var baseUrl = await generateUrlProfile(username);

    const browser = await chromium.launch({
        headless: false,
    });
    
    const page = await browser.newPage();

    //page.userAgent(
    //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36"
    //);
    
    await page.goto(baseUrl);
    
    var listVideo = [];

    console.log(chalk.green("[*] Getting list video from: " + username));

    var loop = true;
    
    while (loop) {
        listVideo = await page.evaluate(() => {
            const listVideo = document.querySelectorAll("a");
            
            const videoUrls2 = Array.from(listVideo)
                                    .map((item) => item.href)
                                    .filter((href) => href.includes("/video/"))
                                    .filter((value, index, self) => {
                                        self.indexOf(value) === index
                                    });
            return videoUrls2;
    });

    console.log(chalk.green(`[*] ${listVideo.length} video found`));

    previousHeight = await page.evaluate("document.body.scrollHeight");

    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");

    await page
            .waitForFunction(`document.body.scrollHeight > ${previousHeight}`, {
                timeout: 10000,
            })
            .catch(() => {
                console.log(chalk.red("[X] No more video found"));

                console.log(
                    chalk.green(`[*] Total video found: ${listVideo.length}`)
                );
                
                loop = false;
            });
            
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

    await browser.close();
    return listVideo;
};

const getRedirectUrl = async (url) => {
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
        const response = await fetch(url, {
            redirect: "follow",
            follow: 10,
        });
        
        url = response.url;
        console.log(chalk.green("[*] Redirecting to: " + url));
    }
    
    return url;
};

const getIdVideo = async (url) => {
    if (url.includes("/t/")) {
        url = await new Promise((resolve) => {
            require("follow-redirects").https.get(url, function (res) {
                return resolve(res.responseUrl);
            });
        });
    }
    
    const matching = url.includes("/video/");
    const matchingPhoto = url.includes("/photo/");

    let idVideo = url.substring(
        url.indexOf("/video/") + 7,
        url.indexOf("/video/") + 26
    );
    
    if (matchingPhoto) {
        idVideo = url.substring(
            url.indexOf("/photo/") + 7,
            url.indexOf("/photo/") + 26
        );
    } 
    else if (!matching) {
        console.log(chalk.red("[X] Error: URL not found"));
        exit();
    }
    
    // Tiktok ID is usually 19 characters long and sits after /video/
    return idVideo.length > 19
        ? idVideo.substring(0, idVideo.indexOf("?"))
        : idVideo;
};

(async () => {
    const choice = { choice: "Single Download (URL)", type: "Without Watermark" };
    
    var listVideo = [];
    
    if (choice.choice === "Mass Download (Username)") {
        const usernameInput = await getInput(
            "Enter the username with @ (e.g. @username) : "
        );

        const username = usernameInput;

        listVideo = await getListVideoByUsername(username);
        
        if (listVideo.length === 0) {
            console.log(chalk.yellow("[!] Error: No video found"));
            exit();
        }
    
    } else if (choice.choice === "Mass Download with (txt)") {
        var urls = [];
        
        // Get URL from file
        const fileInput = await inquirer.prompt([
            {
                type: "fuzzypath",
                name: "input",
                excludePath: (nodePath) => {
                    return (
                        nodePath.includes("node_modules") ||
                        nodePath.includes(".git")
                    );
                },

                // excludePath :: (String) -> Bool
                // excludePath to exclude some paths from the file-system scan
                excludeFilter: (nodePath) => {
                    if (nodePath.includes(".txt")) console.log(nodePath);
                    return !nodePath.endsWith(".txt");
                },

                // excludeFilter :: (String) -> Bool
                // excludeFilter to exclude some paths from the final list, e.g. '.'
                itemType: "file",
                // itemType :: 'any' | 'directory' | 'file'
                // specify the type of nodes to display
                // default value: 'any'
                // example: itemType: 'file' - hides directories from the item list
                rootPath: __dirname,
                // rootPath :: String
                // Root search directory
                message: "Select a target directory for your component:",
                default: "list.txt",
                suggestOnly: false,
                // suggestOnly :: Bool
                // Restrict prompt answer to available choices or use them as suggestions
                depthLimit: 5,
                // depthLimit :: integer >= 0
                // Limit the depth of sub-folders to scan
                // Defaults to infinite depth if undefined
            },
        ]);
        
        // await getInput("Enter the file path : ");
        const file = fileInput.input;
        
        if (!fs.existsSync(file)) {
            console.log(chalk.red("[X] Error: File not found"));
            exit();
        }
        
        // read file line by line
        const rl = readline.createInterface({
            input: fs.createReadStream(file),
            crlfDelay: Infinity,
        });
        
        for await (const line of rl) {
            if (urls.includes(line)) {
                console.log(
                    chalk.yellow(`[!] Skipping duplicate entry: ${line}`)
                );
                
                continue;
            }
            
            urls.push(line);
            console.log(chalk.green(`[*] Found URL: ${line}`));
        }
        
        for (var i = 0; i < urls.length; i++) {
            const url = await getRedirectUrl(urls[i]);
            listVideo.push(url);
        }
    } else {
        const { default: clipboardy } = await import('clipboardy');

        const getClipboardContent = async () => {
            return clipboardy.read();
        };

        const urlInput = await getClipboardContent();
        const resolvedUrl = await getRedirectUrl(urlInput);
        listVideo.push(resolvedUrl);

        // const urlInput = await getInput("Paste the URL: ");

        // for (const url of urlInput) {
        //     const resolvedUrl = await getRedirectUrl(url);
        //     listVideo.push(resolvedUrl);
        // }
    }
    
    console.log(chalk.green(`[!] Found ${listVideo.length} video`));
    
    let deleted_videos_count = 0;
    
    for (var i = 0; i < listVideo.length; i++) {
        console.log(
            chalk.green(`[*] Downloading video ${i + 1} of ${listVideo.length}`)
        );
        
        console.log(chalk.green(`[*] URL: ${listVideo[i]}`));
        
        var data = await getVideo(
            listVideo[i],
            choice.type == "With Watermark"
        );
        
        // check if video was deleted => data empty
        if (data == null) {
            console.log(chalk.yellow(`[!] Video ${i + 1} was deleted!`));
            deleted_videos_count++;
            continue;
        }
        
        await downloadMedia(data)
            .then(() => {
                console.log(chalk.green("[+] Downloaded successfully"));
            })
            .catch((err) => {
                console.log(chalk.red("[X] Error: " + err));
            });
    }
    
    if (deleted_videos_count > 0) {
        console.log(
            chalk.yellow(
                `[!] ${deleted_videos_count} of ${listVideo.length} videos were deleted!`
            )
        );
    }

})();
