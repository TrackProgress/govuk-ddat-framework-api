import JobFamilyService from '../../services/JobFamilyService'

export default async function handler(req, res) {
  const proto =
    req.headers["x-forwarded-proto"] || req.connection.encrypted
      ? "https"
      : "http";
  res.status(200).json( await JobFamilyService.getJobFamilyList(`${proto}://${req.headers.host}`) )
}