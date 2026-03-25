document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function removeParticipant(activityName, participantEmail) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Unable to remove participant.", "error");
        return;
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  }

  function createParticipantSection(activityName, participants) {
    const participantsSection = document.createElement("div");
    participantsSection.className = "participants-section";

    const participantsHeading = document.createElement("p");
    participantsHeading.className = "participants-heading";
    participantsHeading.textContent = "Current Participants";
    participantsSection.appendChild(participantsHeading);

    if (participants.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "participants-empty";
      emptyState.textContent = "No students have signed up yet.";
      participantsSection.appendChild(emptyState);
      return participantsSection;
    }

    const participantsList = document.createElement("ul");
    participantsList.className = "participants-list";

    participants.forEach((participant) => {
      const participantItem = document.createElement("li");
      participantItem.className = "participant-item";

      const participantEmail = document.createElement("span");
      participantEmail.className = "participant-email";
      participantEmail.textContent = participant;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "participant-remove-button";
      removeButton.setAttribute("aria-label", `Remove ${participant} from ${activityName}`);
      removeButton.textContent = "X";
      removeButton.addEventListener("click", async () => {
        await removeParticipant(activityName, participant);
      });

      participantItem.appendChild(participantEmail);
      participantItem.appendChild(removeButton);
      participantsList.appendChild(participantItem);
    });

    participantsSection.appendChild(participantsList);
    return participantsSection;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.className = "activity-description";
        description.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.className = "activity-meta";
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.className = "activity-meta availability-badge";
        availability.textContent = `${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(description);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);
        activityCard.appendChild(createParticipantSection(name, details.participants));

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
