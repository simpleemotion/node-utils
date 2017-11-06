'use strict';

module.exports = {
  types: {
    token: {
      BEARER: 'Bearer'
    },
    events: [
      'integration.talkdesk.installation',
      'integration.talkdesk.update',
      'operations.completed',
      'storage.analysis.added',
      'storage.analysis.removed',
      'storage.analysis.renamed',
      'storage.audio.added',
      'storage.audio.moved',
      'storage.audio.processed',
      'storage.audio.removed',
      'storage.features.added',
      'storage.features.removed',
      'storage.features.renamed',
      'storage.folder.added',
      'storage.model.added',
      'storage.model.removed',
      'storage.model.renamed'
    ],
    grant: {
      AUTHORIZATION_CODE: 'authorization_code',
      IMPLICIT: 'implicit',
      PASSWORD: 'password',
      CLIENT_CREDENTIALS: 'client_credentials',
      REFRESH_TOKEN: 'refresh_token',
      TWO_FACTOR: 'two_factor'
    },
    operation: [
      'compute-contact-metrics',
      'detect-events',
      'detect-silence',
      'diarize-speaker-voice',
      'diarize-speaker-words',
      'extract-features',
      'extract-problem-summary',
      'extract-sentiment',
      'extract-tags',
      'extract-tone',
      'extract-voice-features',
      'prettify-transcript',
      'process-audio',
      'train-voice-model',
      'transcribe-diarized-speech',
      'transcribe-raw-speech',
      'transload-audio'
    ],
    owner: [
      'user',
      'organization',
      'service'
    ],
    creator: [
      'user',
      'organization',
      'operation'
    ],
    entity: [
      'type.simpleapis.com/storage.audio',
      'type.simpleapis.com/storage.audio.recording'
    ]
  },
  roles: {
    root: 100,
    system: 50,
    service: 40,
    user: 30,
    worker: 20,
    application: 10,
    public: 0
  }
};
