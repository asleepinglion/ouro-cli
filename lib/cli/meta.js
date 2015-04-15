module.exports = {

  class: "Cli",
  extends: "Application",
  description: "The Cli application class enables the rapid development of command line tools.",

  methods: {

    routeRequest: {
      description: "Determine the command and action to run based on the command line arguments.",
      async: true
    },

    errorHandler: {
      description: "Handles errors that occur during the request process."
    }

  }

};