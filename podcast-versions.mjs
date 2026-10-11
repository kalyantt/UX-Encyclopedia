// Published audio is immutable: add a new version instead of replacing a file.
export const podcastVersions={
  'UX-001':{
    defaultVersion:'v1',
    versions:[
      {
        id:'v1',
        label:'Version 1 · Full episode',
        src:'assets/audio/UX-001-podcast.m4a',
        transcript:'podcast-UX-001.html',
        note:'Full episode · 11 min · Calmer pace · Recommended',
      },
      {
        id:'v2',
        label:'Version 2 · Expressive test',
        src:'assets/audio/UX-001-v2-preview.m4a',
        transcript:'podcast-UX-001-v2-preview.html',
        note:'32-second preview only · Faster delivery · Kept for comparison',
      },
    ],
  },
  ...Object.fromEntries(['UX-002','UX-003','UX-004','UX-005','UX-006','UX-097','UX-098'].map(id=>[id,{
    defaultVersion:'v2',
    versions:[{
      id:'v1',
      label:'Version 1 · Earlier voice test',
      src:`assets/audio/${id}-v1-conversation-preview.m4a`,
      transcript:`podcast-${id}-conversation-preview.html`,
      note:'Short preview · Different voice engine · Kept for comparison',
    },{
      id:'v2',
      label:'Version 2 · UX-001 voices',
      src:`assets/audio/${id}-v2-kokoro-preview.m4a`,
      transcript:`podcast-${id}-conversation-preview.html`,
      note:'Short preview · Same voice engine and voice IDs as the UX-001 full episode · Full episode pending',
    }],
  }])),
};
