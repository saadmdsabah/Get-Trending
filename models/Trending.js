const mongoose = require("mongoose");

const trendingTopicSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
  topics: [
    {
      rank: { type: Number, required: true },
      topic: { type: String, required: true },
      count: { type: String, required: true },
      duration: { type: String, required: true },
      proxyIP: { type: String, required: true },
    },
  ],
});

const TrendingTopic = mongoose.model("TrendingTopic", trendingTopicSchema);

module.exports = TrendingTopic;
