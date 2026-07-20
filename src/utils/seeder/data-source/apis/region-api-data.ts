import { activityTypes } from "../../../../utils/definitions/constants/activity-types";
import { AccessType, IAPI } from "../../../../utils/interfaces/api.interface";
import { moduleTypes } from "../../../../utils/definitions/constants/modules";
import { activityCode, activityName } from "../../activities/region-activities";
import { apiMethods } from "../../../../utils/definitions/constants/api-methods";
import { datatypes } from "../../../../utils/definitions/constants/data-types";
import { searchTypes } from "../../../../utils/definitions/constants/search-types";
import { defaultSearchParams } from "../../../../utils/helpers/seeder.helper";

const regionsApiData: IAPI[] = [
  // create region
  {
    activity_type: activityTypes.Create,
    module: moduleTypes.Regions,
    activity_name: activityName.createRegion,
    activity_code: activityCode.createRegion,
    activity_method: apiMethods.POST,
    url: "/api/v1/masters/regions",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [
      {
        key: "name",
        value: "string",
        type: datatypes.String,
        required: true,
        parent: false,
        parent_key: "",
      },
      {
        key: "country_id",
        value: "string",
        type: datatypes.Object,
        required: true,
        parent: false,
        parent_key: "",
      },
    ],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },

  // list region
  {
    activity_type: activityTypes.List,
    module: moduleTypes.Regions,
    activity_name: activityName.listRegion,
    activity_code: activityCode.listRegion,
    activity_method: apiMethods.GET,
    url: "/api/v1/masters/regions",
    status: true,
    form_params: [],
    search_params: [
      ...defaultSearchParams,
      {
        title: "name_like",
        value: "name",
        allowed_values: [],
        datatype: datatypes.String,
        search_type: searchTypes.Partial,
        is_active: true,
        admin_access: true,
        user_access: true,
        employee_access: true,
      },
      {
        title: "country_id",
        value: "country_id._id",
        allowed_values: [],
        datatype: datatypes.String,
        search_type: searchTypes.Exact,
        is_active: true,
        admin_access: true,
        user_access: true,
        employee_access: true,
      },
      {
        title: "country_name_like",
        value: "country_id.name",
        allowed_values: [],
        datatype: datatypes.String,
        search_type: searchTypes.Partial,
        is_active: true,
        admin_access: true,
        user_access: true,
        employee_access: true,
      },
      {
        title: "country_status_id",
        value: "country_id.status_id._id",
        allowed_values: [],
        datatype: datatypes.String,
        search_type: searchTypes.Exact,
        is_active: true,
        admin_access: true,
        user_access: true,
        employee_access: true,
      },
      {
        title: "country_status_title_like",
        value: "country_id.status_id.title",
        allowed_values: [],
        datatype: datatypes.String,
        search_type: searchTypes.Partial,
        is_active: true,
        admin_access: true,
        user_access: true,
        employee_access: true,
      },
    ],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
      user_access: { type: AccessType.ALL, keys: [] },
      employee_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: true,
    employee_access: true,
    required_authentication: true,
  },

  // update region
  {
    activity_type: activityTypes.Update,
    module: moduleTypes.Regions,
    activity_name: activityName.updateRegion,
    activity_code: activityCode.updateRegion,
    activity_method: apiMethods.PUT,
    url: "/api/v1/masters/regions/:id",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
      user_access: { type: AccessType.ALL, keys: [] },
      employee_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [
      {
        key: "name",
        value: "string",
        type: datatypes.String,
        required: true,
        parent: false,
        parent_key: "",
      },
      {
        key: "country_id",
        value: "string",
        type: datatypes.String,
        required: false,
        parent: false,
        parent_key: "",
      },
      {
        key: "created_by",
        value: "string",
        type: datatypes.String,
        required: true,
        parent: false,
        parent_key: "",
      },
      {
        key: "updated_by",
        value: "string",
        type: datatypes.String,
        required: false,
        parent: false,
        parent_key: "",
      },
      {
        key: "status",
        value: "boolean",
        type: datatypes.Boolean,
        required: false,
        parent: false,
        parent_key: "",
      },
    ],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },

  // delete region
  {
    activity_type: activityTypes.Delete,
    module: moduleTypes.Regions,
    activity_name: activityName.deleteRegion,
    activity_code: activityCode.deleteRegion,
    activity_method: apiMethods.DELETE,
    url: "/api/v1/masters/regions/:id",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
  // activate region
  {
    activity_type: activityTypes.Activate,
    module: moduleTypes.Regions,
    activity_name: activityName.activateRegion,
    activity_code: activityCode.activateRegion,
    activity_method: apiMethods.PATCH,
    url: "/api/v1/masters/regions/:id/activate",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
  // deactivate region
  {
    activity_type: activityTypes.Deactivate,
    module: moduleTypes.Regions,
    activity_name: activityName.deactivateRegion,
    activity_code: activityCode.deactivateRegion,
    activity_method: apiMethods.PATCH,
    url: "/api/v1/masters/regions/:id/deactivate",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
  // show region
  {
    activity_type: activityTypes.Show,
    module: moduleTypes.Regions,
    activity_name: activityName.showRegion,
    activity_code: activityCode.showRegion,
    activity_method: apiMethods.GET,
    url: "/api/v1/masters/regions/:id",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
      user_access: { type: AccessType.ALL, keys: [] },
      employee_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: true,
    employee_access: true,
    required_authentication: true,
  },
  // import region
  {
    activity_type: activityTypes.Import,
    module: moduleTypes.Regions,
    activity_name: activityName.importRegion,
    activity_code: activityCode.importRegion,
    activity_method: apiMethods.POST,
    url: "/api/v1/masters/regions/import",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
      user_access: { type: AccessType.ALL, keys: [] },
      employee_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
  // export region
  {
    activity_type: activityTypes.Export,
    module: moduleTypes.Regions,
    activity_name: activityName.exportRegion,
    activity_code: activityCode.exportRegion,
    activity_method: apiMethods.GET,
    url: "/api/v1/masters/regions/export",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
  {
    activity_type: activityTypes.Export,
    module: moduleTypes.Countries,
    activity_name: activityName.exportTemplateRegion,
    activity_code: activityCode.exportTemplateRegion,
    activity_method: apiMethods.GET,
    url: "/api/v1/masters/regions/export-template",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
  // log region
  {
    activity_type: activityTypes.Log,
    module: moduleTypes.Regions,
    activity_name: activityName.logRegion,
    activity_code: activityCode.logRegion,
    activity_method: apiMethods.GET,
    url: "/api/v1/masters/regions/log",
    status: true,
    form_params: [],
    search_params: [],

    access_params: {
      admin_access: { type: AccessType.ALL, keys: [] },
    },

    control_params: [],
    payload_params: [],
    admin_access: true,
    user_access: false,
    employee_access: false,
    required_authentication: true,
  },
];

export default regionsApiData;
