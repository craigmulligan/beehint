(function() {
  const CONTAINER_ID = "beehint-container";
  const MODAL_ID = "beehint-modal";
  const BUTTON_ID = "beehint-button";

  function remove_element(element) {
    const exists = document.getElementById(element.id);
    if (exists) {
      exists.remove();
    }
  }

  function display_component(title, child) {
    const container = document.createElement("div");
    const heading = document.createElement("h2");
    heading.style.fontSize = "20px";
    heading.style.fontWeight = "800";
    heading.style.margin = "10px 0px";
    heading.style.transform = "uppercase";
    heading.innerHTML = title;
    container.appendChild(heading);
    container.appendChild(child);
    return container;
  }

  function get_current_words() {
    const words_list = document.getElementsByClassName("sb-wordlist-pag")[0];
    const word_elements = words_list.getElementsByTagName("li");
    const results = [];

    for (var elem of word_elements) {
      results.push(elem.textContent);
    }

    return results;
  }

  function get_word_starts(doc, words) {
    const elements = doc.querySelectorAll(
      ".interactive-content .content:last-child span"
    );
    const word_starts = [];

    for (const elem of elements) {
      word_starts.push(
        elem.textContent
          .trim()
          .split(" ")
          .map((e) => e.split("-"))
      );
    }

    const word_starts_map = word_starts
      .flat()
      .sort()
      .reduce((acc, a) => {
        acc[a[0]] = { total: a[1], current: 0 };
        return acc;
      }, {});

    for (const word of words) {
      for (const start in word_starts_map) {
        if (word.startsWith(start)) {
          word_starts_map[start]["current"] += 1;
        }
      }
    }

    return word_starts_map;
  }

  function get_matrix(doc, words) {
    const table = doc.querySelectorAll(".interactive-content .table")[0];
    const matrix = {};
    const totals = []

    for (let i = 0, row; (row = table.rows[i]); i++) {
      const row_key = row.cells[0].innerText.trim().replace(":", "");
      matrix[row_key] = [];
      let total_words_got = 0;
      for (let j = 0, col; (col = row.cells[j]); j++) {
        const total = col.innerText.trim();


        if (row_key == "" || j == 0 || total == "-") {
          matrix[row_key].push(total);
        } else if (j == row.cells.length - 1) {
          matrix[row_key].push(render_fraction(total_words_got, total));
        } else if (row_key == "??") {
          // last row tally totals. 
          matrix[row_key].push(render_fraction(totals[j], total));
        } else {
          let words_got = 0;
          for (const word of words) {
            if (word.charAt(0) == row_key && word.length == matrix[""][j]) {
              words_got += 1;
              total_words_got += 1;
            }
          }

          matrix[row_key].push(render_fraction(words_got, total));

          if (totals[j]) {
            totals[j] += words_got
          } else {
            totals[j] = words_got
          }
        }
      }
    }

    return matrix;
  }

  async function get_hints(words) {
    const link = document.getElementsByClassName("pz-toolbar-button__hints")[0];
    const text = await fetch(link.href, { cache: "force-cache" }).then(
      function(res) {
        return res.text();
      }
    );
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const word_starts = get_word_starts(doc, words);
    const matrix = get_matrix(doc, words);

    return [word_starts, matrix];
  }

  function display_word_starts(word_starts) {
    const ul = document.createElement("ul");
    ul.className = "";
    let current_line = null;
    const styles = {
      margin: "10px 0px",
      fontWeight: "100",
      fontSize: "20px",
      fontFamily: "nyt-imperial",
      textTransform: "uppercase",
      lineHeight: "30px",
    };

    for (const [index, [start, values]] of Object.entries(Object.entries(word_starts))) {
      const fraction = render_fraction(values.current, values.total);
      if (current_line && start.charAt(0) != current_line.charAt(0) || index == Object.keys(word_starts).length - 1) {
        const line = document.createElement("li");
        for (s in styles) {
          line.style[s] = styles[s];
        }
        if (index == Object.keys(word_starts).length - 1) {
          current_line += `${start}-${fraction} `;
        }

        line.innerHTML = current_line;
        ul.appendChild(line);

        current_line = `${start}-${fraction} `;
      } else {
        if (current_line) {
          current_line += `${start}-${fraction} `;
        } else {
          current_line = `${start}-${fraction} `;
        }
      }
    }

    return display_component("Two letter list", ul);
  }

  function display_matrix(matrix) {
    const tbl = document.createElement("table");
    tbl.style.width = "100px";

    for (const [row_key, cols] of Object.entries(matrix)) {
      const tr = tbl.insertRow();
      for (const [i, col] of cols.entries()) {
        const td = tr.insertCell();
        td.innerHTML = col;
        td.style.minWidth = "40px";
        td.style.height = "30px";
        if (row_key == "" || row_key == "??" || i == 0 || i == cols.length - 1) {
          td.style.fontWeight = "700";
          td.style.textTransform = "uppercase";
        }
      }
    }

    return display_component("Spelling Bee Grid", tbl);
  }

  async function display_modal() {
    const modal = document.createElement("div");
    modal.height = 100;
    modal.id = MODAL_ID;

    remove_element(modal);

    const container = document.getElementById(CONTAINER_ID);
    container.appendChild(modal);

    const results = get_current_words();
    const [word_starts, matrix] = await get_hints(results);

    modal.appendChild(display_matrix(matrix));
    modal.appendChild(display_word_starts(word_starts));
  }

  function display_button() {
    const btn = document.createElement("button");
    btn.innerHTML = "Show hints";
    btn.id = BUTTON_ID;
    btn.value = "off";
    btn.style.background = "none";
    btn.style.padding = "0";
    btn.style.border = "none";
    btn.style.margin = "0px 0 10px";
    btn.style.textDecoration = "underline";

    remove_element(btn);

    const container = document.getElementById(CONTAINER_ID);
    container.appendChild(btn);
  }

  document.addEventListener("click", function(e) {
    if (e.target && e.target.id == BUTTON_ID) {
      const button = e.target;
      if (button.value == "off") {
        display_modal();
        button.value = "on";
        button.innerHTML = "Hide Hints";
      } else {
        const modal = document.getElementById(MODAL_ID);
        remove_element(modal);
        button.value = "off";
        button.innerHTML = "Show Hints";
      }
    }
  });

  function display_container() {
    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.style = "margin-left:25px;";

    remove_element(container);

    const heading = document.getElementsByClassName("sb-wordlist-heading")[0];
    heading.parentNode.insertBefore(container, heading.nextSibling);
  }

  function render_fraction(numerator, denominator) {
    if (numerator == denominator) {
      return `<s>${numerator}/${denominator}</s>`;
    }

    return `${numerator}/${denominator}`;
  }

  display_container();
  display_button();
})();
