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
  },
  export: {
    run: 'export:run',
  },
  backup: {
    create: 'backup:create',
    restore: 'backup:restore',
  },
} as const
