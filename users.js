const { User } = require('./models');

async function fetchUsersInChunks(chunkSize) {
  let offset = 0;
  let usersChunk = [];

  do {
    const users = await User.findAll({
      limit: chunkSize,
      offset
    });

    if (users.length === 0) {
      break; // No more users to fetch
    }

    // Process the chunk of users here (e.g., push them to an array)
    usersChunk = usersChunk.concat(users);

    // Update the offset for the next iteration
    offset += chunkSize;
  } while (true);

  return usersChunk;
}

module.exports = fetchUsersInChunks;
