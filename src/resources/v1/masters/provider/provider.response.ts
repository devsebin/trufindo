const userResponse = (user: any) =>
  user
    ? {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      }
    : null;

const typeResponse = (type: any): any => ({
  id: type._id,
  name: type.name,
  description: type.description,
  is_active: type.is_active,
  is_tested: type.is_tested,
  test_log: type.test_log,
  is_default: type.is_default,
});

const supportedCountryResponse = (country: any): any => {
  const types = country.type || [];

  const typeSummary = types.reduce(
    (acc: any, t: any) => {
      acc.type_count++;

      if (t.is_active) acc.active_type_count++;
      else acc.inactive_type_count++;

      if (t.is_tested) acc.tested_type_count++;
      else acc.untested_type_count++;

      return acc;
    },
    {
      type_count: 0,
      active_type_count: 0,
      inactive_type_count: 0,
      tested_type_count: 0,
      untested_type_count: 0,
    },
  );

  return {
    id: country._id,
    country_id: country.countryId,
    code: country.countryCode,
    is_active: country.is_active,
    is_tested: country.is_tested,
    support_from: country.supportFrom,
    support_until: country.supportUntil,

    ...typeSummary,

    types: types.map(typeResponse),
  };
};

export const providerResponse = (provider: any): any => {
  const supportedCountries = provider.supportedCountries || [];

  return {
    id: provider._id,
    name: provider.name,
    is_active: provider.is_active,
    is_deleted: provider.is_deleted,

    current_status: provider.status_id.title,
    country_count: supportedCountries.length,

    active_country_count: supportedCountries.filter((c: any) => c.is_active)
      .length,

    inactive_country_count: supportedCountries.filter((c: any) => !c.is_active)
      .length,

    supported_countries: supportedCountries.map(supportedCountryResponse),

    created_by: userResponse(provider.created_by),

    updated_by: userResponse(provider.updated_by),

    deleted_by: userResponse(provider.deleted_by),

    created_at: provider.createdAt,
    updated_at: provider.updatedAt,
    deleted_at: provider.deleted_at,
  };
};

export const providerListResponse = (data: any[]): any =>
  data.map(providerResponse);

export const providerDetailResponse = (data: any): any =>
  providerResponse(data);
