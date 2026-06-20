Component({
  properties: {
    report: { type: Object, value: {} as any },
    idea: { type: String, value: '' },
    hasPrd: { type: Boolean, value: false },
  },

  data: {
    verdictClass: '',
    reasonPoints: [] as string[],
  },

  observers: {
    'report.verdict'(verdict: string) {
      const cls = verdict === '建议尝试' ? 'try'
        : verdict === '值得探索' ? 'explore' : 'no';
      this.setData({ verdictClass: cls });
    },
    'report.verdict_reason'(reason: string) {
      if (!reason) {
        this.setData({ reasonPoints: [] });
        return;
      }
      // Split long paragraphs by sentence-ending punctuation for structured display
      const points = reason
        .split(/[。！？；;]/)
        .map(s => s.trim())
        .filter(s => s.length > 4);
      this.setData({ reasonPoints: points });
    },
  },

  methods: {
    viewReport() {
      this.triggerEvent('viewReport');
    },

    generatePrd() {
      this.triggerEvent('generatePrd');
    },

  },
});
