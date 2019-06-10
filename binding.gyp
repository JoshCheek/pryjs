{
  "targets": [{
    "target_name":  "magic",
    "sources":      [ "src/magic.cc" ],
    "include_dirs": [
      "<!(node -e \"require('nan')\")"
    ],
    "libraries":    [],
    "dependencies": [],
    "defines":      []
  }]
}
