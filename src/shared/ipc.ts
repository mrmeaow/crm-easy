export const IpcChannels = {
  contacts: {
    list: 'contacts:list',
    create: 'contacts:create',
    update: 'contacts:update',
    remove: 'contacts:remove',
    mergeGroups: 'contacts:mergeGroups',
    merge: 'contacts:merge',
    importParse: 'contacts:importParse',
    importRun: 'contacts:importRun',
  },
  activities: {
    list: 'activities:list',
    create: 'activities:create',
  },
  notes: {
    list: 'notes:list',
    create: 'notes:create',
  },
  leads: {
    list: 'leads:list',
    create: 'leads:create',
    update: 'leads:update',
    remove: 'leads:remove',
    move: 'leads:move',
    convert: 'leads:convert',
    importParse: 'leads:importParse',
    importRun: 'leads:importRun',
  },
  tags: {
    list: 'tags:list',
    create: 'tags:create',
    forContact: 'tags:forContact',
    assign: 'tags:assign',
  },
  customFields: {
    listDefs: 'customFields:listDefs',
    createDef: 'customFields:createDef',
    deleteDef: 'customFields:deleteDef',
    listValues: 'customFields:listValues',
    saveValues: 'customFields:saveValues',
  },
  search: {
    query: 'search:query',
  },
  undo: {
    list: 'undo:list',
    restore: 'undo:restore',
  },
  stages: {
    list: 'stages:list',
    create: 'stages:create',
    update: 'stages:update',
    remove: 'stages:remove',
    reorder: 'stages:reorder',
  },
  deals: {
    list: 'deals:list',
    create: 'deals:create',
    update: 'deals:update',
    remove: 'deals:remove',
    settle: 'deals:settle',
    history: 'deals:history',
  },
  tasks: {
    list: 'tasks:list',
    create: 'tasks:create',
    update: 'tasks:update',
    remove: 'tasks:remove',
  },
  settings: {
    get: 'settings:get',
    set: 'settings:set',
    hasPin: 'settings:hasPin',
    setPin: 'settings:setPin',
    verifyPin: 'settings:verifyPin',
    encryptPassphrase: 'settings:encryptPassphrase',
  },
  reports: {
    activities: 'reports:activities',
  },
  export: {
    run: 'export:run',
  },
  backup: {
    create: 'backup:create',
    restore: 'backup:restore',
  },
} as const
