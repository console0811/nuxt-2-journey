class RouteModel {
  constructor({ text = "", name = "", icon = "", params = {} } = {}) {
    this.text = text;
    this.name = name;
    this.params = params;
    this.icon = icon;
  }
}

export default class NavigationModel {
  constructor({ role = "" } = {}) {
    this.role = role;
    this.routes = [
      new RouteModel({ text: "home", name: "home", icon: "mdi-email-open" }),
      new RouteModel({
        text: "profile",
        name: "profile",
        icon: "mdi-account",
      }),
      new RouteModel({
        text: "dashboard",
        name: "dashboard-type",
        icon: "mdi-email-open",
        params: { type: role },
      }),
      new RouteModel({
        text: "scholarships",
        name: "scholarships",
        icon: "mdi-email-open",
      }),
    ];

    if (role == "admin") {
      this.routes.push(
        new RouteModel({
          text: "user-management",
          name: "user-management",
          icon: "mdi-email-open",
        })
      );
    }
  }
}
