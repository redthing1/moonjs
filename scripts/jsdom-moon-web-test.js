const path = require('path');
const { JSDOM } = require('jsdom');
const moonPath = 'file://' + path.join(__dirname, '../packages/moon-web/dist/moon-web.min.js');

const html = `
<!doctype html>
<html>
<head></head>
<body>
  <div id="root"></div>
  <script src="${moonPath}"></script>
  <script type="text/moon">
    Moon.view.mount(document.getElementById('root'));
    var count = 0;
    function render() {
      Moon.m.view = (
        <div>
          <h1>{'Count: ' + count}</h1>
          <button onClick={() => { count++; render(); }}>+</button>
        </div>
      );
    }
    render();
  </script>
</body>
</html>`;

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'file:///test.html', pretendToBeVisual: true });
  await new Promise(resolve => {
    dom.window.addEventListener('load', () => resolve(), { once: true });
    // fallback timeout
    setTimeout(resolve, 3000);
  });
  const h1 = dom.window.document.querySelector('h1');
  const button = dom.window.document.querySelector('button');
  const initial = h1 && h1.textContent;
  button && button.click();
  const after = h1 && h1.textContent;
  console.log({ initial, after });
})();
