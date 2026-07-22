import { api } from "../../../database/apis/apis-db-model";
import authenticationApiData from "../data-source/apis/authentication-api-data";
import countriesApiData from "../data-source/apis/countries-api-data";
import providersApiData from "../data-source/apis/provider-api-data";
import uploadApiData from "../data-source/apis/upload-api-data";
import declaimerApiData from "../data-source/apis/declaimer-api-data";
import statusesApiData from "../data-source/apis/statuses-apis";
import rolesApiData from "../data-source/apis/roles-api-data";
import regionsApiData from "../data-source/apis/region-api-data";
import authenticationSessionsApiData from "../data-source/apis/authentication-sessions-api-data";
import createUserRegistrationApiData from "../data-source/apis/user-registration-api-data";
import userApiData from "../data-source/apis/user-api-data";
import servicesApiData from "../data-source/apis/service-api-data";
import prioritiesApiData from "../data-source/apis/priority-api-data";

export const seedActivity = async () => {
  await api.deleteMany({});

  const allApis = [
    ...authenticationApiData,
    ...countriesApiData,
    ...providersApiData,
    ...uploadApiData,
    ...declaimerApiData,
    ...statusesApiData,
    ...rolesApiData,
    ...regionsApiData,
    ...authenticationSessionsApiData,
    ...createUserRegistrationApiData,
    ...userApiData,
    ...servicesApiData,
    ...prioritiesApiData,
  ];

  if (allApis.length > 0) {
    await api.insertMany(allApis);
  }
};
