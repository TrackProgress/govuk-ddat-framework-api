import JobFamilyService from '../../services/JobFamilyService'

export default async function handler(req, res) {
  res.status(200).json( await JobFamilyService.getJobFamilyList() )
}