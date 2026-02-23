module.exports = (req, res, next) => {
  const role = req.user?.role
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}