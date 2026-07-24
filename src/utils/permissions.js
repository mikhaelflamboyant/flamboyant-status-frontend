const TI_AREA = 'Tecnologia da Informação'
const TI_MANAGER_ROLES = ['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR']

export const isTIManager = (user) =>
  TI_MANAGER_ROLES.includes(user?.role) &&
  (user?.area === TI_AREA || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(user?.role))