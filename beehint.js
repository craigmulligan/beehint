(function() {
  const CONTAINER_ID = "beehint-container"

  function remove_element(element) {
    const exists = document.getElementById(element.id)
    if (exists) {
      exists.remove()
    }
  }

  function get_current_words() {
    const words_list = document.getElementsByClassName("sb-wordlist-pag")[0]
    const word_elements = words_list.getElementsByTagName("li")
    const results = []

    for (var elem of word_elements) {
      results.push(elem.textContent)
    }

    return results
  }

  function get_word_starts(doc, words) {
    // gets hints for word_starts
    const elements = doc.querySelectorAll(".interactive-content .content:last-child span")
    const word_starts = []

    for (var elem of elements) {
      word_starts.push(elem.textContent.trim().split(" ").map(e => e.split("-")))
    }

    const word_starts_map = word_starts.flat().sort().reduce((acc, a) => {
      acc[a[0]] = { "total": a[1], "current": 0 }
      return acc
    }, {})

    for (const word of words) {
      for (const start in word_starts_map) {
        if (word.startsWith(start)) {
          word_starts_map[start]["current"] += 1
        }
      }
    }

    return word_starts_map
  }

  function get_matrix(doc, words) {
    // gets hints for table
    const table = doc.querySelectorAll(".interactive-content .table")[0]
    const matrix = {}

    for (var i = 0, row; row = table.rows[i]; i++) {
      const row_key = row.cells[0].innerText.trim().replace(":", "")
      matrix[row_key] = []
      total_words_got = 0
      //iterate through rows
      for (var j = 0, col; col = row.cells[j]; j++) {
        total = col.innerText.trim()

        if (row_key == "" || j == 0 || total == "-") {
          matrix[row_key].push(total)
        } else if (j == row.cells.length - 1) {
          // last column is totals
          matrix[row_key].push(render_fraction(total_words_got, total))
        } else {
          //iterate through columns
          words_got = 0
          for (const word of words) {
            if (word.charAt(0) == row_key && word.length == matrix[""][j]) {
              words_got += 1
              total_words_got += 1
            }
          }

          matrix[row_key].push(render_fraction(words_got, total))
        }
      }
    }

    return matrix
  }

  async function get_hints(words) {
    const link = document.getElementsByClassName("pz-toolbar-button__hints")[0]
    const text = await fetch(link.href, { cache: "force-cache" }).then(function(res) { return res.text() })
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const word_starts = get_word_starts(doc, words)
    const matrix = get_matrix(doc, words)

    return [word_starts, matrix]
  }

  function display_word_starts(word_starts) {
    ul = document.createElement("ul")
    ul.className = "sb-wordlist-items-pag"

    for (start in word_starts) {
      const line = document.createElement("li");
      line.className = "sb-anagram"
      const values = word_starts[start]
      const fraction = render_fraction(values.current, values.total)
      line.innerHTML = `${start}: ${fraction}`
      ul.appendChild(line)
    }
    return ul
  }

  function display_matrix(matrix) {
    tbl = document.createElement('table');
    tbl.style.width = '100px';

    for (const [row_key, cols] of Object.entries(matrix)) {
      const tr = tbl.insertRow();
      for (col of cols) {
        const td = tr.insertCell();
        td.innerHTML = col
        td.style.minWidth = "60px"
        td.style.height = "30px"
      }
    }

    return tbl
  }

  async function display_modal() {
    console.log("loading modal...")
    const modal = document.createElement("div");
    modal.height = 100
    modal.id = "beehint-modal"

    remove_element(modal)

    const container = document.getElementById("beehint-container")
    container.appendChild(modal);

    const results = get_current_words()
    const [word_starts, matrix] = await get_hints(results)

    const ul = display_word_starts(word_starts)
    const tbl = display_matrix(matrix)

    modal.appendChild(ul)
    modal.appendChild(tbl)
  }

  function display_button() {
    const btn = document.createElement("button");
    btn.innerHTML = "Show hints!";
    btn.className = "rootSquare-0-2-18"
    btn.id = "beehint-button"
    btn.style = "z-index:999"
    btn.value = "off"

    remove_element(btn)

    const container = document.getElementById("beehint-container")
    container.appendChild(btn);
  }

  document.addEventListener('click', function(e) {
    if (e.target && e.target.id == "beehint-button") {
      const button = e.target
      //do something
      if (button.value == "off") {
        display_modal()
        button.value = "on";
        button.innerHTML = "Hide Hints"
      } else {
        const modal = document.getElementById("beehint-modal")
        remove_element(modal)
        button.value = "off";
        button.innerHTML = "Show Hints"
      }
    }
  });

  function display_container() {
    const container = document.createElement("div");
    container.className = "beehint-container"
    container.id = "beehint-container"
    container.style = "margin-left:25px;"

    remove_element(container)

    const heading = document.getElementsByClassName("sb-wordlist-heading")[0]
    heading.parentNode.insertBefore(container, heading.nextSibling)
  }

  function render_fraction(numerator, denominator) {
    // renders it with strike through if it's whole.
    if (numerator == denominator) {
      return `<s>${numerator}/${denominator}</s>`
    }

    return `${numerator}/${denominator}`
  }

  display_container()
  display_button()
})()
