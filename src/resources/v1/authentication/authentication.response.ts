export const otpResponse = (data: any): any => ({
  id: data._id,
  phoneNumber: data.phoneNumber,
  iso_code: data.iso_code,
});
