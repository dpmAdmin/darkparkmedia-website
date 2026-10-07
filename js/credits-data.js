/* Credit pop-up content. Keys match data-credit on each row of the credits list.
   Role, network and season come from the row itself; this file adds the
   description, the media, and anything extra (an optional "fact" adds a Fun fact box).

   media items:
     { k: "yt",  id: "VIDEOID", start: 3, label: "Official clip" }   YouTube (official uploads)
     { k: "mp4", src: "path.mp4", poster: "path.jpg", label: "..." }   a file hosted on this site or R2
     { k: "img", src: "path.jpg", label: "..." }                      a still image

   To add a photo or clip later, drop the file in assets/img/credits/ and add one line here. */
window.CREDITS = {
  "street-outlaws": {
    blurb: "Discovery's street racing franchise out of Oklahoma City. I was lead editor from 2017 to 2024, growing it to 200+ content hours a year and 10+ spin-offs, and I'm still on the live and YouTube side.",
    series: [
      "No Prep Kings S1-6, then S7",
      "Fastest in America S1-4",
      "Mega Cash Days S1-2",
      "Memphis S3",
      "America's List S2",
      "Mega Race S2",
      "Farmtruck and AZN S1",
      "Locals Only S1",
      "Race Night in America S1",
      "Street Outlaws: Live",
      "The Outlaws"
    ],
    media: [
      { k: "mp4", src: "assets/video/no-prep-kings-open.mp4", poster: "assets/img/credits/so-strip.jpg", label: "No Prep Kings season open" },
      { k: "yt", id: "vozilM0VlSk", label: "\"He Jumped the Light!\"" },
      { k: "yt", id: "YnXjDZ79uK8", label: "Chuck vs Justin Swanstrom" },
      { k: "img", src: "assets/img/credits/so-burnout.jpg", label: "From the open" },
      { k: "img", src: "assets/img/credits/so-crash.jpg", label: "From the open" },
      { k: "img", src: "assets/img/credits/so-team.jpg", label: "From the open" }
    ]
  },
  "american-chopper": {
    blurb: "Orange County Choppers, the Teutul family, and the custom bikes. I was lead editor on the Discovery reunion series and editor on season 9.",
    fact: "American Chopper is one of the shows that kicked off my career in editorial. I was an assistant editor on it in the show's early years.",
    media: [{ k: "yt", id: "qa1WXiXnHek", start: 3, label: "The Last Ride" }]
  },
  "car-matchmaker": {
    blurb: "Esquire Network series hosted by Spike Feresten, who gets to know someone who needs a car and finds three vehicles for them to choose from.",
    media: [{ k: "img", src: "assets/img/credits/car-matchmaker.jpg", pos: "center 25%", label: "Car Matchmaker with Spike Feresten" }]
  },
  "the-great-food-truck-race": {
    blurb: "Food Network competition where teams drive food trucks across the country and the team with the most sales wins. Season 4 ran the longest route in series history, 4,181 miles, and the winning team kept the truck and a $50,000 prize.",
    media: [{ k: "yt", id: "7Fk7bwPbeAc", label: "Official clip" }]
  },
  "go-fund-yourself": {
    blurb: "A crowdfunding show for Cheddar from Verb Technology. Entrepreneurs pitch a panel of Titans, and viewers can invest in real time. I supervise the edit, and I cut the sizzle.",
    media: [
      { k: "mp4", src: "https://pub-a1c054ea180f4328ac52f0e81a880d84.r2.dev/Examples%20of%20Work/GFY%20Sizzle%205%20Fine%20Cut%20082525/GFY%20Sizzle%205%20Fine%20Cut%20082525.mp4", poster: "assets/img/credits/gfy-thumb.jpg", label: "Sizzle" },
      { k: "yt", id: "3VlbC70NX4w", label: "Cheddar episode" }
    ]
  },
  "guys-grocery-games": {
    blurb: "Guy Fieri hosts chefs competing inside a grocery store, cooking with whatever the aisles give them.",
    media: [{ k: "yt", id: "6afwfNSjDBQ", label: "Official clip" }]
  },
  "all-star-academy": {
    blurb: "Food Network competition hosted by Ted Allen, pairing home cooks with Food Network stars as mentors, with a $50,000 grand prize.",
    media: [{ k: "yt", id: "KAeBEJROTQQ", label: "Official clip" }]
  },
  "home-free": {
    blurb: "FOX series where couples compete to win a dream home, reviving a run-down house each week under contractor Mike Holmes.",
    media: [{ k: "img", src: "assets/img/credits/home-free.jpg", label: "Home Free" }]
  },
  "amazing-america": {
    blurb: "Sportsman Channel series with Sarah Palin exploring America's outdoor lifestyle, with stories from coast to coast. Produced by Pilgrim.",
    media: [{ k: "img", src: "assets/img/credits/amazing-america.jpg", fit: "contain", label: "Amazing America with Sarah Palin" }]
  },
  "saving-private-k-9": {
    blurb: "Sportsman Channel series about military and law enforcement service dogs: their training, their heroics, and their lives after service. Produced by Pilgrim.",
    media: [{ k: "img", src: "assets/img/credits/saving-private-k-9.jpg", label: "Saving Private K-9" }]
  },
  "camp-stew": {
    blurb: "Penn Jillette adds his commentary to some of the wildest outdoor clips ever caught on tape. A half hour of hunting, fishing, and outdoor chaos for Sportsman Channel.",
    media: [{ k: "img", src: "assets/img/credits/camp-stew.jpg", label: "Camp Stew with Penn Jillette" }]
  },
  "the-north-korea-crisis": {
    blurb: "A two-hour History special on North Korea's complicated history, extreme politics, and rigid societal standards, and the legacy of internal oppression and external aggression they created. I was lead editor.",
    media: [{ k: "img", src: "assets/img/credits/north-korea-crisis.jpg", label: "North Korea: Dark Secrets" }]
  },
  "dirty-jobs": {
    blurb: "Mike Rowe takes on the messy, unusual jobs that keep America running. A Discovery staple.",
    media: [{ k: "yt", id: "5dSj2B-Ahtg", label: "Official clip" }]
  },
  "the-ultimate-fighter": {
    blurb: "The UFC's reality competition: fighters live together, train under coaches, and fight their way through the season.",
    media: [{ k: "yt", id: "ixSQm053XaY", label: "Official UFC look back" }]
  },
  "all-you-can-eat": {
    blurb: "A food series for History.",
    media: [{ k: "img", src: "assets/img/credits/all-you-can-eat.jpg", label: "All You Can Eat" }]
  },
  "patricia-heaton-parties": {
    blurb: "Patricia Heaton hosts themed party menus on Food Network. The series won a Daytime Emmy for Outstanding Culinary Program.",
    media: [{ k: "yt", id: "poCDpevKrYs", label: "Official promo" }]
  },
  "restaurant-stakeout": {
    blurb: "Restaurateur Willie Degel puts hidden cameras inside struggling restaurants to find out what is going wrong, then helps fix it.",
    media: [
      { k: "img", src: "assets/img/credits/restaurant-stakeout.jpg", pos: "center 8%", label: "Restaurant Stakeout" },
      { k: "yt", id: "FAIXpJL7gkE", label: "Official promo" }
    ]
  },
  "tia-mowry-at-home": {
    blurb: "Tia Mowry cooks and entertains at home with her family and friends, for Cooking Channel.",
    media: [{ k: "img", src: "assets/img/credits/tia-mowry-at-home.jpg", pos: "center 35%", label: "Tia Mowry at Home" }]
  },
  "my-big-fat-fabulous-life": {
    blurb: "TLC series following Whitney Way Thore through her life, work, and relationships. I edited the reunion.",
    media: [{ k: "yt", id: "QZpyuAk8VXM", label: "Official clip" }]
  },
  "my-fair-wedding": {
    blurb: "Wedding planner David Tutera takes over a bride's event with only weeks to go, putting his own touch on the plans, for WE tv.",
    media: [{ k: "yt", id: "tPGHsi590sA", label: "Official clip" }]
  },
  "virgins": {
    blurb: "TLC series from Crazy Legs Productions following four adults in their 30s and 40s who are done waiting and ready to take on love and intimacy.",
    media: [{ k: "yt", id: "4Sg8iJKeeUU", label: "Official clip" }]
  },
  "shinesty": {
    blurb: "A comedic docu-series about the young entrepreneurs behind Shinesty, the Boulder, Colorado apparel company known for its outrageous clothing.",
    media: [{ k: "img", src: "assets/img/credits/shinesty.jpg", pos: "center 30%", label: "Shinesty" }]
  }
};
