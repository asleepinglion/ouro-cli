module.exports = {

  class: "Command",
  extends: "Class",

  aliases: [],

  description: "The base class for CLI commands.",

  methods: {

    run: {
      description: "The run method is exected by the CLI routing engine when the command is requested.",
      async: true
    }
  }

};