function get_current_words() {
  const words_list = document.getElementsByClassName("sb-wordlist-pag")[0]
  const word_elements = words_list.getElementsByTagName("li")
  const results = []

  for (var elem of word_elements) {
    results.push(elem.textContent)
  }

  return results
}

async function get_hints() {
  const link = document.getElementsByClassName("pz-toolbar-button__hints")[0]
  const text = await fetch(link.href).then(function(res) { return res.text() })
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const elements = doc.querySelectorAll(".interactive-content .content:last-child span")
  const word_starts = []

  for (var elem of elements) {
    word_starts.push(elem.textContent.trim().split(" ").map(e => e.split("-")))
  }

  const word_starts_map = word_starts.flat().reduce((acc, a) => {
    acc[a[0]] = { "total": a[1], "current": 0 }
    return acc
  }, {})

  return [word_starts_map]
}

async function main() {
  const results = get_current_words()
  const [word_starts] = await get_hints()

  for (const word of results) {
    for (const start in word_starts) {
      if (word.startsWith(start)) {
        console.log("found start!", word, start)
        word_starts[start]["current"] += 1
      }
    }
  }
  console.log(word_starts)
}


main()
