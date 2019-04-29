---
title: React Selectors
author: Baruch Velez
authorURL: http://github.com/baruchvlz
authorImageURL: https://avatars1.githubusercontent.com/u/14321495?s=460&v=4
---

[ReactJS](https://github.com/facebook/react) is one of the most widely use Front-End libraries in the web. Along side React, many developers use styling tools that will minify or re-write the class attribute values attached to the HTML elements via `className` props in JSX. These minifications and overwrites makes it difficult to select the generated HTML using the browser's `querySelector` and `querySelectorAll` methods since it's not guaranteed that the class name will remain the same.

Today we introduce two new commands, `react$` and `react$$`, to WebdriverIO's browser object that allows you to select single or multiple React generated HTML nodes with an easy to use API. These new commands will return the HTML element for the React component in where you have access to the complete [HTMLElement API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement).
