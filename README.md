# h1 - A privacy plugin for Firefox

## What is h1?
h1 attempts to reduce the amount of information you provide sites for tracking purposes. HTTP headers can transfer a substantial amount of information about users, and are often used to get information out of an end-user with or without their knowledge. h1 is an extremely lightweight plugin that allows removal or modification of several HTTP headers. As with most applications in computing, there is no "one size fits all" solution for browser configurations, and h1 is no exception. The settings are flexible enough to let you choose exactly what you're willing to share (and with whom).

There's a nifty little browser fingerprinting app [here](https://panopticlick.eff.org/) - check it out!

## What does h1 do?
Currently, there are 3 headers h1 can change:
* **ETag:** The [`ETag`](https://en.wikipedia.org/wiki/HTTP_ETag) header was originally proposed as a caching mechanism, although it has been known to be used as a tracking tool. h1 can remove ETags altogether.
* **Referer:** The [`Referer`](https://en.wikipedia.org/wiki/HTTP_referer) header is sent to any website you navigate to, and includes the URI of the last site you were visiting. h1 can remove referer tags altogether.
* **User-Agent:** The [`User-Agent`](https://en.wikipedia.org/wiki/User_agent) header tells a webserver about your browser. It includes information such as what browser you are using (Firefox, Chrome, etc.), what OS you are using (Windows, OS-X, Arch Linux, etc.), and so on. h1 randomizes your user agent string on each HTTP request, based off of a local (and easily modifiable) database.

## When _wouldn't_ I want to use h1?
Some websites will use your user agent (and possibly other headers) as an added layor of insurance that you are who you say you are. Thus, h1 may interfere with some sites that attempt to be 'extra secure'. An online banking website would be a typical example. You can add specific sites as exceptions to h1's whitelist.

## What is configurable?
If you only want part of h1's functionality, that's fine. Any of the above mentioned features can be disabled from the options menu. There is a whitelist you can use to allow certain sites access to your "real" headers. Fake user agent strings are stored in your Firefox profile directory (`h1/ua.def`) as a plaintext file. You can add or remove any UA strings you'd like. By default, non-mobile strings from Chrome, Firefox, Internet Explorer, Opera, and Safari are used.

## NoScript Integration
If you're already using NoScript, h1 can seamlessly use NoScript's permissions for its own whitelisting. This includes both permanent and temporary permissions.

## Let's do this! Where's the install button?
This project is still in development, and as such I'm not hosting it on addons.mozilla.org yet. I'll be adding a makefile soon, but if you're looking at this you're probably comfortable with

1. Zipping all the files in this folder
2. Naming the zip file h1.xpi
3. Dragging that file onto Firefox

Remember - if you compile and install manually you won't get updates automatically.

## Testing your browser
Check these sites out if you want to verify that everything is working:
* [HTTP Referer](http://www.whatismyreferer.com/)
* [User Agent](http://whatsmyuseragent.com/)

## License

h1 is released under the [MIT License](http://mit-license.org/).
