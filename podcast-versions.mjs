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
};
