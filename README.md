# 529renew
Chrome extension to allow "23 and me" customers to extract their DNA segment match information

This is now available on the Chrome Store.
## Status October 2024
I think it has now been a year since 23 and Me blocked access to the chromosome browser and just about everything else. In-common matches were returned some time in 2024, seemingly with fewer matches being identified than before (unconfirmed).

Without the chromosome browser, 23 and Me is the least useful site for genealogical search - despite the supposed size of its database of testers.  And at this time it looks like it is most likely to go out of business.

The changes around the enforced migration to sqlite in this extension were never completed by the time 23andMe disabled the chromosome browser. This code has since had a hurried hack to try to get some ICW match details, and to save a bit of the information that 23andMe provide for you to look at on your web page.

Once the extension is installed, a page is displayed with the extension notes and instructions for operation in non-DNA times.
Instructions on this mode of operation are now [in the wiki for this project](https://github.com/CameronD73/529renew/wiki/2024-%E2%80%90-Extracting-Relatives-Data)


## Contents:
* [Installation Guide](#installation)
* [Database Migration](#database-import)
* [The special "Results" tab](#the-tabpage-named-529renew-results)
* [User Settings](#settings)
* [Normal operation (DNA)](#day-to-day-operation)
* [Strategies to minimise lockout](#strategies-to-minimise-lockout)

## Background
This is a fork of the *529andYou* Chrome extension, in order to move from manifest V2 to V3. V2 code ceased working for Chrome users some time in 2023, and has been blocked for fresh installations beyond July 2022.

Most of the original source was public domain and we have been unable to contact the original developer.

The repository contains a modified copy of the code from manifest version 2 as well as the development towards a manifest V3 extension (and beyond).

Most of the details are in [this project's Wiki](https://github.com/CameronD73/529renew/wiki), but you do not need to know any of that to use the extension. This Readme file is the nearest you will get to a user's manual.

# Installation
The latest released version is available in the Chrome store. For experimental installs (developer mode) see details in the wiki.

Versions of 529Renew at 1.9.0 and later (October 2023) require the ability to load the sqlite-wasm code with the Origin-Private File-System. It seems that browsers Egde, Vivaldi and Opera all provide suitable support and work under ms-windows based on my minimal testing.

By the time you read this, they (Chrome and Edge) will no doubt have changed their user interface again, but as I write this the process is...
* For Chrome, from the menu (3 dots on the right) click on `more tools->extensions` , or `settings->extensions`.  Then click on the sub-menu (3 horizontal lines on the left - don't you love a consistent user interface) and way down the bottom is `open Chrome web store`.  Type __529renew__ into the search box and it should be the only extension offered. Click that and the details page opens up, along with a button `Add to Chrome`.
* For Edge, click on 3 horizontal dots top right, then select `extensions`-> `manage extensions` and click on `Chrome web store`.  At some stage you need to enable the option `Allow extensions from other stores`.  Search for __529renew__ and click on the one extension listed and  the details page opens up, along with a button `Add to Chrome`.
* I have briefly tested using Vivaldi and Opera under windows and 529Renew operates successfully.

The following steps then apply whichever browser you are using:
*  you get a warning that this extension can "read and change your data on you.23andme.com. This is badly worded - it means view and change the contents on the web page; it cannot change your DNA data on 23andMe.com . In theory the extension _could_ be made to edit and update your match notes, but it doesn't. It also warns that the extension can "read your browsing history" (I have no idea where this comes from - we don't ask for this capability and the extension doesn't access your history).  Click `Add extension`
* The extension ID is hgckkjajmcmbificinfabmaelboedjic.
* It should  then open a new tab and display a message box saying "created a new local database". This will only happen once for a given browser profile, unless you delete the extension, in which case the database is immediately deleted as well.
* You should _pin the 529renew icon to the toolbar_ so that you can access the settings page.  On Vivaldi it seems to be present by default, as soon as the extension is installed. For other browsers you need to go to `manage extensions` to pin 
* The "extensions" icon (a jigsaw puzzle piece on Chrome, a box on Opera) should be visible on the toolbar.  Click on that and the drop-down should show 529renew. Chrome shows a pin, while edge shows what might be an eye. either case, you want to click that to enable the 529renew icon to appear on the toolbar.  This is needed to give you access to the settings.
* you are now ready to start.
* if you have been away for a long time and have old data that you want to migrate from _529 and You_, then go to the section at the end of this page.

## The tab/page named "529Renew Results"

It is important to understand that this tab is a vital part of the operation of 529Renew. 
When saving triangulation data there must be exactly one "results" tab present.  Hidden beneath this tab is nearly all the functionality of 529Renew.

The code is designed to create this tab if it does not exist whenever you first open or refresh the page listing DNA relatives.
It will also create the results tab automatically if the _settings_ pop-up page is opened.

On the page of an individual DNA match, triangulation will fail if the results tab is not open already (this is a bug currently not fixed - it falls into a deep sleep and never awakens. You have to close the tab and start again, or refresh the page _after opening the results tab_).
If you press the `Open 529renew` button then it will create the page if necessary, then pass the DNA matches name to the selector on the results page and bring the tab to the front.

It is safe to be using the results tab to view already saved results at the same time as another tab is doing the triangulations.

***Warning:***  If your Chrome startup setting is to "Continue where you left off" then the Results tab can be reopened ready for action. However, if you have a level of debugging enabled then all the debugging log may be saved and restored across shutdown and startup. This seems to eventually render the filesystem very sluggish for many seconds upon shutdown, so remember to disable debugging when you do not need it, or occasionally refresh the results tab to clear the console log.

### gruesome details
Part of the security model of web browser extensions is that any tab/page displaying content from 23andMe (or any external web server) is not permitted to access the database.
Consequently there is a stream of messages passing between the DNA match page and the results page with requests for and results from database operations.
If this gets interrupted (or never starts) then things get confused.

If multiple results tabs are opened at the same time then a different form of confusion ensues, where each one fights to carry out the same tasks.
There is, however one situtation where multiple results tabs are deliberately allowed to be open at the same time.
If you were to click on `create match table` in the results page, and then click on a match's name on the table of segments then a new results tab is opened in case you want to compare the segments between two sets of results. It is acceptable to simply view results in two tabs at the same time but the code is not designed to be triangulating at the same time.


## Settings

The settings can be viewed and changed in a popup window by clicking on the 529Renew icon on the toolbar in the top right, near the extension button. The settings are  stored/retrieved across sessions via code attached to the "529 Results" tab, so make sure it is open.
You should review the settings before you start collecting triangulation data.

Note - _there is no accept/cancel operation_: setting changes are saved immediately after you exit a settings input selector (click somewhere else, or press the tab key).

When you have finished, simply click back in another tab and the popup should be removed.

### delay between web requests
(default 2 seconds). This should help make 23 and me servers complain less, such as giving error 429 and locking your access. (See below for more details)

### rounding of base-pair addresses
This has been removed, and results are always saved without rounding. The minimum overlap setting can be used to achieve similar effects.

### rounding of centiMorgan values
now rounds by default to 2 decimal places, purely for appearances. The second decimal place is almost meaningless in most cases, as uncertainty is usually higher than this. It also stops output files being padded out with numbers that are meaningless.

### Padding on DNA Relatives list:
This is the number of pixels of blank space used to pad out the top and bottom of each person on the DNA relatives list. The default used by 23andMe was 16. Set this to a smaller number to reduce the amount of scrolling you need.

### Maximum Note length
If this number is greater than zero then any Notes you have added to the DNA relative will be displayed after the name. No more than this number of characters will be displayed in the relatives list - the full number will always be shown in the original Notes section on the relative's individual profile page and they will appear in a "mouseover", when you hover the pointer over the person's name.

### Minimum segment overlap
Similar to GDAT's option, and it has no bearing on 23 and Me's definition of whether segments overlap enough to be considered _shared_.  In  _529 and You_  the display routines considered segments to "overlap" provided they merely touch - for example the end address of one segment is the same as the starting address of another.  If you set this parameter to a number above zero then the start and end must overlap by at least this number of Mbase pairs.

### Action for duplicate imports
When importing results from CSV files, sometimes values are found that already match the conditions for a record in the database. This option determines whether the import should

1. _Ignore_: retain the old values, or
2. _Replace_: overwrite the data in the database with the value in the file.

### Star means "have triangulated"
This option is inoperative at the moment (Oct 2024).
If you  applied the yellow star only to a relative who had been previously triangulated, then set this to yes and 529Renew will change displays accordingly. It has no other meaning and is only useful transitioning data from before version 2. Any triangulations in future will set this parameter directly.

#### Minimum shared DNA (pct):
This parameter sets a lower limit - only matches having at least this percentage in common will be checked and recorded.  This now applies to all ICW, as we cannot tell in advance whether they have overlap.

### Recording segments that are not overlapping
The two options in this section are out of date as of V1.3.0 and have no effect, after 23andMe removed the information about whether there was any overlap.

Normally, the "triangulation" process ignores any matches that have no overlaps.  This pair of related options modify this behaviour.

Say your profile person **A** is in common with **X** and **Y** but the matching segments do not overlap. Normal recording of "triangulation" only accepts matches with 3-way overlaps. Both  _529 and You_ and _529renew_ allow you to shift-click to save segment details between the profile person and  **Y**  and between **X** and  **Y**  when they do not overlap. 

#### Save Segments Mode.
This parameter can be set to "always" or "only with shift-click". If you want to always record segments then this should be set to "always" to save the need for you to remember to hold the shift-key every time.

### Tab action when triangulation completes.
Can be set to "close tab" or "tab remains open".

### Options for Debugging or Troubleshooting
At the bottom of the settings page are options for troubleshooting.
The date setting should be explained sufficiently on the page.

The debug levels determine the verbosity of progress notes that are printed on the javascript console. This console is revealed in Chrome or Edge by pressing F12, or by a right-click on the page background and selecting "inspect". 
This opens the "devtools"   window, and every tab will have its own separate devtools window, which only persists while the tab is present.
Select the "console" tab to view the error and debug log messages.

# Day-to-day operation - with a working Chromosome browser
1. Login to your account on the 23and Me web site
2. start by selecting the kit of the profile you want to compare (if you manage more than one kit)
3. go to the  _DNA Relatives_ page, either from the quick links or the *Family and friends* menu list.
4. by this stage the "529Renew Results" tab should be open and in the background.
5. Open the filter menu: "Profile features and activity" and tick the box "showing ancestry results". This will remove people from this list who do not allow their DNA segments to be viewed.  You could also apply other filters as you see fit.
6. search for the relative of interest and open their page, preferably in a new tab - using separate tabs makes it much easier to keep track of where you are up to and avoids the need to reload the relatives list each time you go back to it.

## Gathering Data
1. having located the page of the relative of interest, scroll to the bottom and click on the `Find Relatives in Common` button.
2. Then click onto `Triangulate into 529Renew` to have the system collect overlapping segment results.
So long as there is at least one with a "yes" or "no" under `DNA Overlap` on each page then 529renew will collect all required data for ICW between the two people.
3. Normally, only matches with DNA overlap showing "yes" will be saved. Holding down shift while you click, or enabling the setting "AlwaysSaveNonOverlaps", will include segment details between each pair even when they have no overlap.
4. If anything goes wrong and you want to continue with that person then you will need to refresh the page and start again.
5. The extension will not query the server  if it has already recorded the matching segment data. You can override this behaviour by using a alt-click on the triangulate button. This forces rereading of _all_ overlapping matches.
6. The "triangulation" process will start from the list (table of 10 matches) currently being shown, so if it is not at the first set then you might miss people on earlier tables.

## Viewing the stored data
The results tab offers a fast way to examine what segments are stored in the 529renew database.
This description assumes you have `Display Mode` set to "_Match and Overlapping Segment Links_". I am not sure there is ever much purpose in using the lesser display modes.
I am not sure if "Omit Aliases" does anything useful these days.
* First, you need to select the match person. It could be one of your profile kit owners, or any of your matches. If you choose a profile person then be prepared for a possibly long list - in this case you should always limit your selection to a single chromosome. You select the person from the drop-down list under `show matches of:`. There are two ways to reduce the need to scan the entire list:
1. If you have a tab already opened at the match person of interest then you can click on `open 529renew` and it will select that person and also bring the results tab to the front. You can then make the required chromosome choice  .
2. You can apply a filter using the `Optional match filter:` section. enter the full name you require, or include the '%' character to use it as a wildcard. The search does not require you to select upper/lower case correctly. Press _Enter_ or click a blank area outside the filter text box and the drop-down list will be replaced with names that match your search filter. You can then choose the person you want, make the required chromosome choice.

* Clicking on `create match table` then produces a list of all matching segments recorded between that person and everybody else.  Sometimes there may be no entries in the list, depending how you have set your options.
* The list displays for each matching segment: chromosome number, start and end base-pair address, the centiMorgan value and the number of SNPs. From V1.2.2, the date that the segment match was stored is included. There is also a button `show overlapping segments`  that allows you to explore further.
* A graphical display of the segments is appended to the page, but only if _you selected a single chromosome_ to create the match table then .
* Clicking on the person named on the left will direct your browser to that person's 23 and Me profile page.
* Clicking on the match name (2nd column) will open up a second results tab. [As warned above](#the-tabpage-named-529renew-results), _do not open this if you are collecting triangulation at the same time_.
### The overlap table
Clicking on  `show overlapping segments` changes the table to list all segments that overlap that selected match, and whether they match the first person, the second, or both.

When there is only one matching segment, then the non-matching person's entry will say either:
1. "_no overlapping matching segment >5 cM_", meaning we can tell from the database that we know there is no overlap there (but most likely this pair share DNA elsewhere), or
2. "_no data_", meaning we cannot tell. Early in database collection perhaps these two have never been compared; as the database is developed it becomes more likely that there is no match at all between the two people. You can confirm lack of a match if you can place that person in the left column, then click on their name to examine their profile. This will show you the DNA match even if it is less than the lower cutoff - for example, it will show if you match with somebody at 9cM, but it will have a largely blank page if there is no significant DNA match.

### Graphical display of overlaps
Below the list of overlapping segments is a graphical display with coloured bars showing the size of overlapping segments and whether they match one or two of the people being compared.

The scaling is in Mbase address - using cM would be preferable but is much more difficult.

At the top of the table the text displays "Segments overlapping match of **person A** and **person B**", followed by chromosome and Mb range.
Note that the allocation of A or B is based on their UID code value, not the order they were selected.

It will show the 3rd person's name with one or two coloured bars:
* The shared segment between person A and person B is in red.
* shared segments matching person A are in brown
* shared segments matching person B are in blue
* darker colours with both bands show a 3-way overlap
* darker colours, but only for one of person A or B means "_no overlapping matching segment >5 cM_" - described in detail above.
* paler colours indicate one person is known to match but the other has "_no data_" - described in detail above.

This graphic can be exported as an SVG file, as described in the next section.

## Exporting your data (no DNA)

## CSV Format as from 23andMe
Coming soon

## Messages
Content has been saved to the database but no export button is ready

## ICWs
Content has been saved to the database but no export button is ready

## Exporting your data - if you have DNA Segments

### CSV format

You can export your segments in CSV format, for example to read into GDAT. The data exported is subject to the restrictions applied by  `show matches of:` and the `chromosome` number.
Normally you would choose "ALL" for both.

If you hold down the Alt key while  clicking the save button then a more complete dataset will be written. This is not suitable for GDAT import, but may be useful for other analysis.  It would also form the basis for importing to another system, although that might not be fully coded at this time (V1.2.1).

### GEXF format
This is a standard text file format suitable for some network analysis and graphical display. The free software [Gephi](https://gephi.org/) is one multiplatform program that can read and produce network graphs from  these files.

This needs more detail on how to get useful results.

### SVG format

Once you have created a graphical display of segment overlaps, you can save this as an SVG file (Scaleable Vector Graphics) that can be viewed in various web browsers and handled in some drawing packages.

## Strategies to minimise lockout
The 23 and Me servers operate under a policy that too high a server request rate will lead to lockout and you will need to prove you are  a human.

As I write this (Jan 2023) it appears that using a delay setting between 1.5 and 2 seconds is normally sufficient to keep the system happy. That timing applies to a single triangulation collection. If you are triangulating with two open tabs at the same time then the request rate will double and most likely upset the servers.

I can usually be triangulating on one tab and have other tabs open and be preparing for triangulation at the same time. These requests are not subject to the delay that 529Renew applies  on segment requests and so will add to the request rate.  I have found that it is possible to get locked out simply by opening up a series of tabs too quickly.

If you are triangulating on one tab only, but your other activities causes a lockout, then generally you will need to go through the multiple Captcha screens once and can then refresh the locked out tabs. The triangulating tab will stop with a message box if it sees an return status of 429. Sometimes it is sufficient to do nothing, wait 30sec to 1 minute, then click `OK` and have the process continue without needing the Captcha.

## Database Import from 529 and You

* 529renew has a somewhat different database format from that of _529 and You_. This is detailed [elsewhere, in the wiki](https://github.com/CameronD73/529renew/wiki/DB-Schema-changes) - most data is the same but it means you cannot simply copy over the old database file.
* This means you need to reimport your data to easily populate the database with all the matches you carefully obtained with 529 and You.
* The file that you need to import is the CSV file that you previously exported for GDAT from _529 and You_. If you have been using 529 and You for a long time then you may have some "build 36" records. The exports from  _529 and You_ could be from either build 36 or from build 37 but not both in the one file. The files do not contain the build info so you have to know if the file is build 37 or not.  _Any file you import will be assumed to be build 37_.
* before you import, you should  consider the rounding parameters - the cM rounding parameter will be used when importing data.  The base-pair address rounding is not used on import, although  _529 and You_ always rounded to the nearest Megabase address to be compatible with older 23andMe outputs.
* Click on the `Import CSV` button and select the required CSV file.  Then wait.  This is a ridiculously slow process (due to Google blocking access to any faster DB operations). If you have a large file and would like progress reports then you can open the debug window using either _F12_ or _ctrl-Shift-I_ or right-click `inspect`(at least under ms-Windows) and select the  _console_ tab.
* message box eventually says "CSV parsing complete" and you can click OK to continue.
* you can safely reload the file or load other versions and new entries will be updated. It will ignore matching segments already loaded (which makes it much faster reloading duplicated data), so it would be perhaps safer to load newer files first.
* you should then be able to examine the `show matches of` list to see testers who have been imported.

## Database Migration from 529Renew before October 2023
Version 1.9 offers an easy migration process and is documented in a web page that popped up when the extension is installed. It no longer works, so is not documented here.

Once the extension is installed, a page is displayed with the extension notes and instructions, and you can also later see them by typing, (or copy/pasting) [chrome-extension://hgckkjajmcmbificinfabmaelboedjic/whatsnew-2_0.html](chrome-extension://hgckkjajmcmbificinfabmaelboedjic/whatsnew-2_0.html)  into the browser address bar.
