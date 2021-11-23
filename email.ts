import sender from "./src/entities/Notification/sender"

const markup = {
  "@context": "http://schema.org",
  "@type": "EmailMessage",
  potentialAction: {
    "@type": "ViewAction",
    url: "https://decentraland.org",
    name: "Verify",
  },
  description: "Verify your email",
}

// const template = 'validate_email_v3'
// const defaultReplacement = {
//   'markup': '<script type="application/ld+json">' + JSON.stringify(markup) + '</script>',
//   'verify_url': 'https://events.decentraland.org'
// }

const template = "upcoming_event_v2"
const defaultReplacement = {
  event_url:
    "https://events.decentraland.org/?event=429b8835-3d48-4854-afae-8a7368f3db8d",
  event_name: "DCL Core Weekly Roundtable",
  event_img:
    "https://s3.amazonaws.com/events.decentraland.org/poster/d28ed80f5f1c5c2e.png",
  share_on_facebook:
    "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fevents.decentraland.org%2F%3Fevent%3D429b8835-3d48-4854-afae-8a7368f3db8d&description=A+discussion+on+the+events+of+the+week+in+Decentraland+with+Matty%28DCLBlogger%29%2C+Anorak%2C+Will+and+Iman%28Metazone.io%29%2C+Franky+Needles+and+weekly+guests.",
  share_on_twitter:
    "https://twitter.com/intent/tweet?hashtags=decentraland%2Csocialworld%2Cvirtualgames&text=A+discussion+on+the+events+of+the+week+in+Decentraland+with+Matty%28DCLBlogger%29%2C+Anorak%2C+Will+and+Iman%28Metazone.io%29%2C+Franky+Needles+and+weekly+guests.+https%3A%2F%2Fevents.decentraland.org%2F%3Fevent%3D429b8835-3d48-4854-afae-8a7368f3db8d",
}

// sender.parseTemplate('validate_email_v3', defaultReplacement)
//   .then(r => {
//     console.log(r.Body.Html.Data)
//   })
sender
  .send({
    template,
    defaultReplacement,
    destinations: ["frami@decentraland.org"],
  })
  .then(console.log)
  .catch(console.error)
