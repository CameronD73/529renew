# 529renew
Chrome extension to allow "23 and me" customers to extract their DNA segment match information

This is now available on the Chrome Store.

## Background
This is a fork of the *529andYou* Chrome extension, in order to move from manifest V2 to V3. V2 code will cease working for Chrome users past early 2023,
and has been blocked for fresh installations beyond July 2022.

Most of the original source was public domain and we have been unable to contact the original developer.

The repository contains a modified copy of the code from manifest version 2 as well as the development towards a manifest V3 extension.

Most of the details are in [this project's Wiki](https://github.com/CameronD73/529renew/wiki).

# Installation
The latest released version is available in the Chrome store. For experimental installs (developer mode) see details in the wiki.

By the time you read this, they will no doubt have changed their user interface again, but as I write this the process is...
* For Chrome, from the menu (3 dots on the right) click on `more tools->extensions` , or `settings->extensions`.  Then click on the sub-menu (3 horizontal lines on the left - don't you love a consistent user interface) and way down the bottom is `open Chrome web store`.  Type __529renew__ into the search box and it should be the only extension offered. Click that and the details page opens up, along with a button `Add to Chrome`.
* For Edge, click on 3 horizontal dots top right, then select `extensions`-> `manage extensions` and click on `Chrome web store`.  At some stage you need to enable the option `Allow extensions from other stores`.  Search for __529renew__ and click on the one extension listed and  the details page opens up, along with a button `Add to Chrome`.

The following processes apply whichever browser you are using:
*  you get a warning that this extension can "read and change your data on you.23andme.com" (badly worded - it means view and change the contents on the web page, I suppose hte extension _could_ edit and update your match notes if it wanted to.) as well as "read your browsing history" (I have no idea where this comes from - we don't ask for it and as far as I know the extension doesn't access your history).  Click `Add extension`
* The extension ID is hgckkjajmcmbificinfabmaelboedjic.
* It should  then open a new tab and display a message box saying "created a new local database". This will only happen once for a given browser profile, unless you delete the extension, in which case the database is immediately deleted as well.
* The "extensions" icon (a jigsaw puzzle piece) should be visible on the toolbar.  Click on that and the drop-down should show 529renew. Chrome shows a pin, while edge shows what might be an eye. either case, you want to click that to enable the 529renew icon to appear on the toolbar.  This is needed to give you access to the settings.
* you are now ready to start.
* if you have old data that you want to migrate from _529 and You_

## Database Import
* 529renew has a somewhat different database format from that of 529 and You. This is detailed [elsewhere, in the wiki](https://github.com/CameronD73/529renew/wiki/DB-Schema-changes) - most data is the same but it means you cannot simply copy over the old database file.
* This means you need to reimport your data to easily populate the database with all the matches you carefully obtained with 529 and You.
* The file that you need to import is the CSV file that you previously exported for GDAT from _529 and You_. If you have been using 529 and You for a long time then you may have some "build 36" records. The exports from  _529 and You_ could be from either build 36 or from build 37 but not both in the one file. The files do not contain the build info so you have to know if the file is build 37 or not.  _Any file you import will be assumed to be build 37_.
* before you import, you should  consider the rounding parameters - the cM rounding parameter will be used when importing data.  The base-pair address rounding is not used on import, although  _529 and You_ always rounded to the nearest Megabase address to be compatible with older 23andMe outputs.
* Click on the `Import CSV` button and select the required CSV file.  Then wait.  This is a ridiculously slow process (due to Google blocking access to any faster DB operations). If you have a large file and would like progress reports then you can open the debug window using either _F12_ or _ctrl-Shift-I_ or right-click `inspect`(at least under ms-Windows) and select the  _console_ tab.
* message box eventually says "CSV parsing complete" and you can click OK to continue.
* you can safely reload the file or load other versions and new entries will be updated. It will ignore matching segments already loaded (which makes it much faster reloading duplicated data), so it would be perhaps safer to load newer files first.
* you should then be able to examine the `show matches of` list to see testers who have been imported.

## The tab/page named "529Renew Results"

It is important to understand that this tab is a vital part of the operation of 529Renew. 
When saving triangulation data there must be exactly one "results" tab present.  Hidden beneath this tab is nearly all the functionality of 529Renew.

The code is designed to create this tab if it does not exist whenever you first open or refresh the page listing DNA relatives.
It will also create the results tab automatically if the settings pop-up page is opened.

On the page of an individual DNA match, triangulation will fail if the results tab is not open already (this is a bug currently not fixed - it falls into a deep sleep and never awakens. You have to close the tab and start again, or refresh the page after opening the results tab).
If you press the `Open 529renew` button then it will create the page if necessary, then pass the DNA matches name to the selector on the results page and bring the tab to the front.

### gruesome details
Part of the security model of web browser extensions is that any tab/page displaying content from 23andMe (or any external web server) cannot access the database.
Consequently there is a stream of messages passing between the DNA match page and the results page with requests for and results from database operations.
If this gets interrupted (or never starts) then things get confused.

If multiple results tabs are opened at the same time then a different form of confusion ensues, where each one fights to carry out the same tasks.
There is, however one situtation where multiple results tabs are deliberately allowed to be open at the same time.
If you were to click on `create match table` in the results page, and then click on a matches' name on the table of segments then a new results tab is opened in case you want to compare the segments between two sets of results. It is acceptable to simply view results in two tabs at the same time but the code is not designed to be triangulating at the same time.


## Settings

The settings can be viewed and changed in a popup window by clicking on the 529Renew icon on the toolbar in the top right, near the extension button.

Setting changes are saved when you exit a settings input selector (click somewhere else, or press the tab key).

When you have finished, simply click back in another tab and the popup should be removed.

### delay between web requests
(default 2 seconds). This should help make 23 and me servers complain less, such as givving error 429. (See below for more details)
* **rounding of base-pair addresses**. The original code rounds to the nearest million in order to match early output from 23 and me. This is discarding significant information, so the default is no rounding, but can be adjusted if required back to the original. A better alternative would be to always save the full address and use the rounding in comparisons.
* **rounding of centiMorgan values** - now rounds by default to 2 decimal places, purely for appearances. It also stops output files being padded out with numbers that are meaningless.
* **segment minimum overlap** Similar to GDAT's option.  Currently the display routines consider segments to "overlap" provided they 

###


## Strategies to minimise lockout due to too high a server request rate.

As I write this (Jan 2023) it appears that using a delay setting between 1.5 and 2 seconds is normally sufficient to keep the system happy. That timing applies to a single triangulation collection. If you are triangulating with two open tabs at the same time then the request rate will double and most likely upset the servers.

I can usually be triangulating on one tab and have other tabs open and be preparing for triangulation at the same time. These requests are not subject to the rate limiting that 529Renew performs on segment requests and so will add to the request rate.  I have found that it is possible to get locked out simply by opening up a series of tabs too quickly.

If you are triangulating on one tab only, but your other activities causes a lockout, then generally you will need to go through the multiple Captcha screens once and can then refresh the locked out tabs. The triangulating tab will stop with a message box if it sees an return status of 429. Sometimes it is sufficient to do nothing, wait 30sec to 1 minute, then click `OK` and have the process continue without needing the Captcha.
