// import CountryModel from "@/database/countries/country-db-model";
// import StatusModel from "@/database/statuses/status-db-model";
// import { buildCountryPayload } from "../../factories/country.factory";
// import createCountriesService from "@/resources/v1/masters/countries/services/create-countries.service";
// import mongoose from "mongoose";

// describe("CreateCountryService (Integration)", () => {
//   beforeEach(async () => {
//     // Required dependency for service
//     const statuses = await StatusModel.create({
//       title: "On hold",
//       label: "on_hold",
//       color: "#FFA500",
//       is_default: true, // 👈 add this
//       created_by: new mongoose.Types.ObjectId(),
//     });
//   });

//   it("should create a country", async () => {
//     const payload = buildCountryPayload();

//     const result: any = await createCountriesService.execute(payload);

//     expect(result.result).toBeDefined();

//     const country = await CountryModel.findOne({
//       iso_code: payload.iso_code,
//     });

//     expect(country).not.toBeNull();
//     expect(country?.name).toBe(payload.name);
//   });

//   it("should throw error if country already exists", async () => {
//     const payload = buildCountryPayload({ name: "United States" });
//     try {
//       await createCountriesService.execute(payload);
//     } catch (err) {
//       expect(err).toHaveProperty("error", true);
//     }
//   });

//   it("should throw error if provider not found", async () => {
//     const payload = buildCountryPayload({ provider: "invalid_provider_id" });
//     console.log(payload);
//     try {
//       await createCountriesService.execute(payload);
//     } catch (err) {
//       expect(err).toHaveProperty("error", true);
//     }
//   });
// });
