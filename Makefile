build:
	echo "javascript:$$(cat beehint.js | tr -d '\011\012\013\014\015')" > beehint.min.js
