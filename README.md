# Tiktok Downloader

THIS DOES NOT WORK WITH SLIDESHOWS

## Explanation
This is a refined, updated version of the [tiktok-downloader](https://github.com/n0l3r/tiktok-downloader) by Naufal Taufiq Ridwan. All credit goes to him, I just removed unused code, updated the endpoint, and formatted the index.js code for readability. Note, this will take a second the first time you run it to set stuff up.

## Installation
run in your terminal:

```
git clone https://github.com/MichaelT-178/tiktok-downloader.git
cd tiktok-downloader
mkdir downloads
npm i
cd ~
```

## Make this work with my Tiktok_Downloader.py CLI tool
run in terminal:

```
pip3 termcolor
mkdir tiktoks
mkdir Modern-Python-Files
cd Modern-Python-Files
touch Tiktok_Downloader.py
```

Go to this link -> [Here](https://github.com/MichaelT-178/Modern-Python-Files/blob/main/TikTok_Downloader.py) and copy the contents of the file into the Tiktok_Downloader.py file you just created.

To run the Tiktok_Downloader.py file in terminal:

```
cd ~
cd Modern-Python-Files
python3 Tiktok_Downloader.py
```

It should be pretty straight forward from there.


## How to make this work with Mass Downloads 
Go to the cli/index.js file in this folder. Note that my Tiktok_Downloader.py is only designed to work with single downloads. You'll have to run it normally for mass downloads.

Replace the following line
```
const choice = { choice: "Single Download (URL)", type: "Without Watermark" };
```

With this line 
```
const choice = getChoice();
```

Then go to your terminal and run the following commands 
```
cd tiktok-downloader 
node cli/index 
```

Now in your tiktok-downloader/downloads file you should see your downloaded videos.
