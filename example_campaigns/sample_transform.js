function transform(finalPlan) {
  const exec = [];
  finalPlan.plan.channels.forEach(ch => {
    if (ch.channel === 'Email') {
      exec.push({
        type: 'email',
        toSegment: ch.channelStrategy.targeting?.segments || ['default'],
        subject: ch.channelStrategy.message.subject,
        bodyTemplate: ch.channelStrategy.message.body,
        sendAt: ch.channelStrategy.right_time,
        meta: ch.channelStrategy.execHints
      });
    } else if (ch.channel === 'SMS') {
      exec.push({
        type: 'sms',
        toSegment: ch.channelStrategy.targeting?.segments || ['default'],
        body: ch.channelStrategy.message.body,
        sendAt: ch.channelStrategy.right_time,
      });
    } else {
      exec.push({
        type: ch.channel.toLowerCase(),
        payload: ch.channelStrategy.message,
        sendAt: ch.channelStrategy.right_time
      });
    }
  });
  return exec;
}