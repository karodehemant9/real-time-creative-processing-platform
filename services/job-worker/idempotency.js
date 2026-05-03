const fs = require("fs");

const path = require("path");

module.exports = {
  exists(fileName) {
    return fs.existsSync(
      path.join(
        "processed",

        fileName,
      ),
    );
  },

  mark(fileName) {
    fs.writeFileSync(
      path.join(
        "processed",

        fileName,
      ),

      "done",
    );
  },
};
