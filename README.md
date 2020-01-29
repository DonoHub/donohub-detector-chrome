## DonoHub Detector

This is a Chrome/Brave/Microsoft Edge browser extension that
turns green when browsing websites that have linked to a
[DonoHub](https://donohub.com) profile.

Statistics are recorded for time spent on these pages, and
reports can be generated to see which DonoHub users' content
you've been passively consuming while you've been browsing. This
way you may choose to contribute donations to them.

All browsing data is stored locally and not communicated to any
remote server - see [privacy policy](PRIVACY.md).

### Linking web pages to your DonoHub profile

To link your web page to a DonoHub profile, you may either add
a `<meta>` tag to the `<head>` of your web page like this:

```html
<meta name="donohub:profile" content="abe" />
```

Or, create a `.well-known/donohub.txt` file at the root of your web
server (e.g. [https://example.com/.well-known/donohub.txt]()), which
will link all pages on that host to the given DonoHub profile. The
`donohub.txt` file should have the following format:

```
@abe
```

The `<meta>` tag will take precedence if both are provided.

### License

Copyright © 2020, [Abe Voelker](https://github.com/abevoelker).
