    /* ============================================================
       Ask — select text or press Ask in the node panel to write a question.
       Copy puts the file path, location, selected text and question on the
       clipboard so the question can be pasted to an agent with its context.
       ============================================================ */
    Archify.ask = (function () {
      var chip = document.getElementById('focus-chip');
      var askButton = document.getElementById('btn-focus-ask');
      var selectionChip = null;
      var box = null;
      var context = null;
      var selectionTimer = 0;

      function filePath() {
        if (location.protocol !== 'file:') return location.origin + location.pathname;
        var value = decodeURIComponent(location.pathname);
        // file:///C:/... becomes C:\...; POSIX paths keep their slashes.
        if (/^\/[A-Za-z]:\//.test(value)) return value.slice(1).split('/').join('\\');
        return value;
      }
      function heading(element) {
        return element ? element.textContent.replace(/\s+/g, ' ').trim() : '';
      }
      function where(element) {
        var parts = [heading(document.querySelector('.header h1, h1'))];
        if (element && chip && chip.contains(element)) {
          parts.push(heading(document.getElementById('focus-label')));
          var section = element.closest('.passport-section');
          if (section) parts.push(heading(section.querySelector('h4')));
          else if (element.closest('#focus-evidence')) parts.push(heading(chip.querySelector('.semantic-passport-evidence-status')));
          else if (element.closest('#relationship-lens-list')) parts.push(viewerText('viewer.passport.relations'));
        } else if (element) {
          var card = element.closest('.card');
          if (card) parts.push(heading(card.querySelector('h3')));
        }
        return parts.filter(Boolean).join(' > ');
      }
      function hideSelectionChip() {
        if (selectionChip) selectionChip.remove();
        selectionChip = null;
      }
      function close() {
        if (box) box.remove();
        box = null;
      }
      function copyText() {
        var question = box.querySelector('textarea').value.trim();
        return viewerText('viewer.ask.file') + ': ' + filePath() + '\n' +
          viewerText('viewer.ask.location') + ': ' + context.location +
          (context.text ? '\n' + viewerText('viewer.ask.selection') + ': "' + context.text + '"' : '') +
          '\n' + viewerText('viewer.ask.question') + ': ' + question;
      }
      function copy() {
        var text = copyText();
        var button = box.querySelector('[data-ask-copy]');
        function done() {
          button.textContent = viewerText('viewer.ask.copied');
          window.setTimeout(function () { if (button.isConnected) button.textContent = viewerText('viewer.ask.copy'); }, 1500);
        }
        function fallback() {
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('data-archify-ask', '');
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); } catch (_) {}
          area.remove();
          done();
        }
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else fallback();
      }
      function build() {
        box = document.createElement('div');
        box.className = 'archify-ask no-print';
        box.setAttribute('data-archify-ask', '');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', viewerText('viewer.ask.title'));
        var bar = document.createElement('div');
        bar.className = 'archify-ask-bar';
        var title = document.createElement('span');
        title.textContent = viewerText('viewer.ask.title');
        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = '\u00d7';
        closeButton.setAttribute('aria-label', viewerText('viewer.ask.close'));
        closeButton.addEventListener('click', close);
        bar.appendChild(title);
        bar.appendChild(closeButton);
        var body = document.createElement('div');
        body.className = 'archify-ask-body';
        var contextBox = document.createElement('div');
        contextBox.className = 'archify-ask-context';
        var area = document.createElement('textarea');
        area.name = 'question';
        area.placeholder = viewerText('viewer.ask.placeholder');
        var row = document.createElement('div');
        row.className = 'archify-ask-row';
        var hint = document.createElement('span');
        hint.textContent = viewerText('viewer.ask.hint');
        var copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'archify-ask-primary';
        copyButton.setAttribute('data-ask-copy', '');
        copyButton.textContent = viewerText('viewer.ask.copy');
        copyButton.addEventListener('click', copy);
        row.appendChild(hint);
        row.appendChild(copyButton);
        body.appendChild(contextBox);
        body.appendChild(area);
        body.appendChild(row);
        box.appendChild(bar);
        box.appendChild(body);
        document.body.appendChild(box);
        // The title bar moves the box; buttons inside it keep their clicks.
        var offsetX = 0;
        var offsetY = 0;
        bar.addEventListener('pointerdown', function (event) {
          if (event.target.closest('button')) return;
          offsetX = event.pageX - box.offsetLeft;
          offsetY = event.pageY - box.offsetTop;
          bar.setPointerCapture(event.pointerId);
        });
        bar.addEventListener('pointermove', function (event) {
          if (!bar.hasPointerCapture(event.pointerId)) return;
          var width = document.documentElement.scrollWidth;
          box.style.left = Math.max(0, Math.min(width - box.offsetWidth, event.pageX - offsetX)) + 'px';
          box.style.top = Math.max(0, event.pageY - offsetY) + 'px';
        });
        bar.addEventListener('pointerup', function (event) {
          if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
        });
      }
      function open(locationText, text, rect) {
        hideSelectionChip();
        context = { location: locationText, text: text };
        var fresh = !box;
        if (fresh) build();
        var contextBox = box.querySelector('.archify-ask-context');
        contextBox.textContent = '';
        var place = document.createElement('b');
        place.textContent = locationText;
        contextBox.appendChild(place);
        if (text) contextBox.appendChild(document.createTextNode('"' + text + '"'));
        if (fresh) {
          // Beside the docked panel when there is one, otherwise under the text.
          var panel = chip && !chip.hidden ? chip.getBoundingClientRect() : null;
          var left = panel && panel.left > 380 ? panel.left - box.offsetWidth - 12 : rect.left;
          var top = panel && panel.left > 380 ? rect.top : rect.bottom + 8;
          var maxLeft = document.documentElement.clientWidth - box.offsetWidth - 8;
          box.style.left = Math.max(8, Math.min(maxLeft, left)) + window.scrollX + 'px';
          box.style.top = Math.max(8, top) + window.scrollY + 'px';
        }
        box.querySelector('textarea').focus();
      }
      function onSelection() {
        window.clearTimeout(selectionTimer);
        selectionTimer = window.setTimeout(function () {
          var selection = window.getSelection();
          var text = selection ? selection.toString().replace(/\s+/g, ' ').trim() : '';
          if (!text || !selection.rangeCount) { hideSelectionChip(); return; }
          var range = selection.getRangeAt(0);
          var start = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
          if (!start || start.closest('[data-archify-ask], input, textarea, svg')) { hideSelectionChip(); return; }
          var rects = range.getClientRects();
          var rect = rects[rects.length - 1] || range.getBoundingClientRect();
          hideSelectionChip();
          selectionChip = document.createElement('button');
          selectionChip.type = 'button';
          selectionChip.className = 'archify-ask-primary archify-ask-chip no-print';
          selectionChip.setAttribute('data-archify-ask', '');
          selectionChip.textContent = viewerText('viewer.ask.button');
          selectionChip.style.left = rect.right + window.scrollX + 6 + 'px';
          selectionChip.style.top = rect.top + window.scrollY - 3 + 'px';
          // Keep the selection while the chip is pressed.
          selectionChip.addEventListener('mousedown', function (event) { event.preventDefault(); });
          selectionChip.addEventListener('click', function () { open(where(start), text.slice(0, 500), rect); });
          document.body.appendChild(selectionChip);
        }, 120);
      }

      document.addEventListener('selectionchange', onSelection);
      document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape' || (!box && !selectionChip)) return;
        // Escape closes the question box first, before focus and presentation.
        event.preventDefault();
        event.stopImmediatePropagation();
        if (box) close();
        else hideSelectionChip();
      }, true);
      if (askButton) {
        askButton.addEventListener('click', function () {
          open(where(document.getElementById('focus-label')), '', askButton.getBoundingClientRect());
        });
      }
      return { open: open, close: close, where: where, copyText: function () { return box ? copyText() : ''; } };
    })();
