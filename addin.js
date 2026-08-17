/* Driver Contact Card — Geotab add-in v1.0
   Read the selected vehicle, make one DriverChange call, render the right state. */

var geotab = geotab || {};
geotab.addin = geotab.addin || {};

geotab.addin.driverContactCard = (function () {
  "use strict";

  var DASH = "—";

  // Geotab returns this sentinel driver when a vehicle has no assignment.
  var UNKNOWN_DRIVER_ID = "UnknownDriverId";

  var FIELDS = ["name", "phone", "email", "license"];

  var el = { root: null, select: null, fields: {} };

  // Vehicle chosen from the fallback picker, once the user has picked one.
  var pickedDeviceId = null;

  // Guards against a slow response for vehicle A overwriting vehicle B's card.
  var requestToken = 0;

  /* --- Mock fixtures -----------------------------------------------------
     Exercised via ?mock=<name>. Inert without the parameter. These are the
     only practical way to reproduce the missing-field cases, which would
     otherwise require blanking fields on real user records. */

  var MOCK_DRIVERS = {
    "full": {
      firstName: "Olivia",
      lastName: "Rhye",
      phoneNumber: "+1 (416) 555-0134",
      name: "olivia@gofleet.com",
      licenseNumber: "D4102-88371-40021"
    },
    "missing-phone": {
      firstName: "Olivia",
      lastName: "Rhye",
      phoneNumber: "",
      name: "olivia@gofleet.com",
      licenseNumber: "D4102-88371-40021"
    },
    "missing-email": {
      firstName: "Olivia",
      lastName: "Rhye",
      phoneNumber: "+1 (416) 555-0134",
      name: "",
      licenseNumber: "D4102-88371-40021"
    },
    "missing-license": {
      firstName: "Olivia",
      lastName: "Rhye",
      phoneNumber: "+1 (416) 555-0134",
      name: "olivia@gofleet.com",
      licenseNumber: null
    }
  };

  function mockName() {
    var match = /[?&]mock=([^&]+)/.exec(window.location.search);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function serveMock(name, onSuccess, onError) {
    // "loading" never settles, so the loading state can be inspected.
    if (name === "loading") {
      return;
    }

    window.setTimeout(function () {
      if (name === "error") {
        onError(new Error("Mock API failure"));
        return;
      }
      if (name === "none") {
        onSuccess([]);
        return;
      }

      var driver = MOCK_DRIVERS[name] || MOCK_DRIVERS.full;
      onSuccess([{
        id: "mockDriverChange",
        dateTime: new Date().toISOString(),
        type: "Driver",
        device: { id: "mockDevice" },
        driver: driver
      }]);
    }, 250);
  }

  /* --- Vehicle resolution (FR-01) ---------------------------------------
     state.device.id is the intended source, but a page add-in opened from
     the main menu carries no device. Fall back rather than dead-end. */

  function deviceIdFromHash(hash) {
    if (!hash || hash.indexOf("device") === -1) {
      return null;
    }
    var match = /(?:^|[#,])id:([^,&]+)/.exec(hash);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function resolveDeviceId(state) {
    if (state && state.device && state.device.id) {
      return state.device.id;
    }

    var fromHash = deviceIdFromHash(window.location.hash);
    if (fromHash) {
      return fromHash;
    }

    return pickedDeviceId;
  }

  /* --- API (FR-02) -------------------------------------------------------
     DriverChange is a historical log, so deviceSearch alone can return a
     driver from months ago. includeOverlappedChanges with fromDate = now
     asks for the assignment in effect right now. */

  function fetchCurrentDriver(api, deviceId, onSuccess, onError) {
    var mock = mockName();
    if (mock) {
      serveMock(mock, onSuccess, onError);
      return;
    }

    api.call("Get", {
      typeName: "DriverChange",
      search: {
        deviceSearch: { id: deviceId },
        fromDate: new Date().toISOString(),
        includeOverlappedChanges: true
      },
      resultsLimit: 10
    }, onSuccess, onError);
  }

  function pickCurrent(records) {
    if (!records || !records.length) {
      return null;
    }

    // Prefer explicit driver assignments, but don't discard everything if the
    // deployment reports a type this add-in doesn't recognise.
    var drivers = records.filter(function (record) {
      return record && record.type === "Driver";
    });
    var pool = drivers.length ? drivers : records.slice();

    pool.sort(function (a, b) {
      return new Date(b.dateTime || 0) - new Date(a.dateTime || 0);
    });

    return pool[0];
  }

  function hasDriver(record) {
    return !!(record &&
      record.driver &&
      record.driver.id !== UNKNOWN_DRIVER_ID);
  }

  /* --- Mapping and rendering --------------------------------------------- */

  function mapDriver(user) {
    var fullName = [user.firstName, user.lastName]
      .filter(function (part) { return part && part.trim(); })
      .join(" ");

    return {
      name: fullName || user.name,
      phone: user.phoneNumber,
      email: user.name,
      license: user.licenseNumber
    };
  }

  function dash(value) {
    if (value === null || value === undefined) {
      return DASH;
    }
    var text = String(value).trim();
    return text ? text : DASH;
  }

  function setField(key, value) {
    var node = el.fields[key];
    if (!node) {
      return;
    }

    var text = dash(value);
    node.textContent = text;
    node.classList.toggle("is-empty", text === DASH);
  }

  function render(stateName, driver) {
    if (!el.root) {
      return;
    }

    if (stateName === "card") {
      FIELDS.forEach(function (key) {
        setField(key, driver ? driver[key] : null);
      });
    }

    el.root.setAttribute("data-state", stateName);
  }

  function clearCard() {
    FIELDS.forEach(function (key) {
      setField(key, null);
    });
  }

  /* --- Picker fallback ---------------------------------------------------- */

  function loadPicker(api) {
    if (!api || !el.select) {
      return;
    }

    api.call("Get", {
      typeName: "Device",
      resultsLimit: 100
    }, function (devices) {
      var sorted = (devices || []).slice().sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""));
      });

      el.select.innerHTML = "";
      el.select.appendChild(new Option("Select a vehicle…", ""));
      sorted.forEach(function (device) {
        el.select.appendChild(new Option(device.name || device.id, device.id));
      });
    }, function (error) {
      console.error("[Driver Contact Card] Device list request failed:", error);
      render("error");
    });
  }

  /* --- Orchestration ------------------------------------------------------ */

  function load(api, state) {
    var deviceId = resolveDeviceId(state);

    if (!deviceId && !mockName()) {
      render("picker");
      loadPicker(api);
      return;
    }

    var token = ++requestToken;
    clearCard();
    render("loading");

    fetchCurrentDriver(api, deviceId, function (records) {
      if (token !== requestToken) {
        return;
      }

      var record = pickCurrent(records);
      if (!hasDriver(record)) {
        render("empty");
        return;
      }

      render("card", mapDriver(record.driver));
    }, function (error) {
      if (token !== requestToken) {
        return;
      }

      // Full detail to the console for debugging; the user sees a generic
      // message so no API internals leak into the UI.
      console.error("[Driver Contact Card] DriverChange request failed:", error);
      render("error");
    });
  }

  function cacheElements() {
    el.root = document.getElementById("dcc-root");
    el.select = document.getElementById("dcc-device");
    el.fields = {};

    if (!el.root) {
      return;
    }

    FIELDS.forEach(function (key) {
      el.fields[key] = el.root.querySelector('[data-field="' + key + '"]');
    });
  }

  return function () {
    return {
      initialize: function (api, state, initializeCallback) {
        cacheElements();

        if (el.select) {
          el.select.addEventListener("change", function () {
            pickedDeviceId = el.select.value || null;
            if (pickedDeviceId) {
              load(api, state);
            }
          });
        }

        initializeCallback();
      },

      focus: function (api, state) {
        load(api, state);
      },

      blur: function () {
        // Never leave one vehicle's driver on screen while another loads.
        requestToken++;
        clearCard();
        render("loading");
      }
    };
  };
}());

/* Local development bootstrap. Outside MyGeotab nothing invokes the add-in
   lifecycle, so start it by hand when a ?mock= fixture is requested. */
(function () {
  "use strict";

  if (!/[?&]mock=/.test(window.location.search)) {
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var addin = geotab.addin.driverContactCard();
    addin.initialize(null, null, function () {
      addin.focus(null, null);
    });
  });
}());
