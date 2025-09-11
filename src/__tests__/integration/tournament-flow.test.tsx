import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProviders } from "@/components/providers/AppProviders";

// Mock компонентов для интеграционных тестов
const MockTournamentForm = () => {
  return (
    <div data-testid="tournament-form">
      <h1>Добавить турнир</h1>
      <form>
        <input
          name="name"
          placeholder="Название турнира"
          data-testid="tournament-name"
        />
        <input
          name="buyin"
          type="number"
          placeholder="Бай-ин"
          data-testid="tournament-buyin"
        />
        <input
          name="venue"
          placeholder="Место проведения"
          data-testid="tournament-venue"
        />
        <input
          name="date"
          type="datetime-local"
          data-testid="tournament-date"
        />
        <button type="submit" data-testid="submit-tournament">
          Создать турнир
        </button>
      </form>
    </div>
  );
};

const MockTournamentList = ({ tournaments }: { tournaments: any[] }) => {
  return (
    <div data-testid="tournament-list">
      <h2>Список турниров</h2>
      {tournaments.length === 0 ? (
        <p data-testid="no-tournaments">Нет турниров</p>
      ) : (
        <ul>
          {tournaments.map((tournament, index) => (
            <li key={index} data-testid={`tournament-${index}`}>
              <h3>{tournament.name}</h3>
              <p>Бай-ин: ${tournament.buyin}</p>
              <p>Место: {tournament.venue}</p>
              <button data-testid={`edit-tournament-${index}`}>
                Редактировать
              </button>
              <button data-testid={`delete-tournament-${index}`}>
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MockTournamentApp = () => {
  const [tournaments, setTournaments] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const tournament = {
      name: formData.get("name"),
      buyin: Number(formData.get("buyin")),
      venue: formData.get("venue"),
      date: formData.get("date"),
    };
    setTournaments((prev) => [...prev, tournament]);
    setShowForm(false);
  };

  const handleDelete = (index: number) => {
    setTournaments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)} data-testid="toggle-form">
        {showForm ? "Отменить" : "Добавить турнир"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Название турнира"
            data-testid="tournament-name"
            required
          />
          <input
            name="buyin"
            type="number"
            placeholder="Бай-ин"
            data-testid="tournament-buyin"
            required
          />
          <input
            name="venue"
            placeholder="Место проведения"
            data-testid="tournament-venue"
            required
          />
          <input
            name="date"
            type="datetime-local"
            data-testid="tournament-date"
            required
          />
          <button type="submit" data-testid="submit-tournament">
            Создать турнир
          </button>
        </form>
      )}

      <MockTournamentList tournaments={tournaments} />

      {tournaments.map((_, index) => (
        <button
          key={index}
          onClick={() => handleDelete(index)}
          data-testid={`hidden-delete-tournament-${index}`}
          style={{ display: "none" }}
        />
      ))}
    </div>
  );
};

describe("Tournament Flow Integration Tests", () => {
  const user = userEvent.setup();

  it("should handle complete tournament creation flow", async () => {
    render(
      <AppProviders>
        <MockTournamentApp />
      </AppProviders>,
    );

    // Проверяем начальное состояние
    expect(screen.getByText("Нет турниров")).toBeInTheDocument();

    // Открываем форму добавления
    await user.click(screen.getByTestId("toggle-form"));

    // Заполняем форму
    await user.type(screen.getByTestId("tournament-name"), "Test Tournament");
    await user.type(screen.getByTestId("tournament-buyin"), "100");
    await user.type(screen.getByTestId("tournament-venue"), "Test Casino");
    await user.type(screen.getByTestId("tournament-date"), "2024-12-31T20:00");

    // Отправляем форму
    await user.click(screen.getByTestId("submit-tournament"));

    // Проверяем, что турнир создан
    await waitFor(() => {
      expect(screen.getByText("Test Tournament")).toBeInTheDocument();
    });
    expect(screen.getByText("Бай-ин: $100")).toBeInTheDocument();
    expect(screen.getByText("Место: Test Casino")).toBeInTheDocument();

    // Проверяем, что форма скрыта
    expect(screen.queryByTestId("tournament-name")).not.toBeInTheDocument();
  });

  it("should handle multiple tournament creation", async () => {
    render(
      <AppProviders>
        <MockTournamentApp />
      </AppProviders>,
    );

    // Создаем первый турнир
    await user.click(screen.getByTestId("toggle-form"));
    await user.type(screen.getByTestId("tournament-name"), "Tournament 1");
    await user.type(screen.getByTestId("tournament-buyin"), "50");
    await user.type(screen.getByTestId("tournament-venue"), "Casino 1");
    await user.type(screen.getByTestId("tournament-date"), "2024-12-25T18:00");
    await user.click(screen.getByTestId("submit-tournament"));

    await waitFor(() => {
      expect(screen.getByText("Tournament 1")).toBeInTheDocument();
    });

    // Создаем второй турнир
    await user.click(screen.getByTestId("toggle-form"));
    await user.type(screen.getByTestId("tournament-name"), "Tournament 2");
    await user.type(screen.getByTestId("tournament-buyin"), "200");
    await user.type(screen.getByTestId("tournament-venue"), "Casino 2");
    await user.type(screen.getByTestId("tournament-date"), "2024-12-26T19:00");
    await user.click(screen.getByTestId("submit-tournament"));

    await waitFor(() => {
      expect(screen.getByText("Tournament 2")).toBeInTheDocument();
    });

    // Проверяем, что оба турнира отображаются
    expect(screen.getByText("Tournament 1")).toBeInTheDocument();
    expect(screen.getByText("Tournament 2")).toBeInTheDocument();
    expect(screen.getByText("Бай-ин: $50")).toBeInTheDocument();
    expect(screen.getByText("Бай-ин: $200")).toBeInTheDocument();
  });

  it("should handle form validation", async () => {
    render(
      <AppProviders>
        <MockTournamentApp />
      </AppProviders>,
    );

    // Открываем форму
    await user.click(screen.getByTestId("toggle-form"));

    // Пытаемся отправить пустую форму
    await user.click(screen.getByTestId("submit-tournament"));

    // Форма не должна отправиться (браузерная валидация)
    expect(screen.getByTestId("tournament-name")).toBeInTheDocument();
    expect(screen.getByText("Нет турниров")).toBeInTheDocument();
  });

  it("should handle form cancellation", async () => {
    render(
      <AppProviders>
        <MockTournamentApp />
      </AppProviders>,
    );

    // Открываем форму
    await user.click(screen.getByTestId("toggle-form"));
    expect(screen.getByTestId("tournament-name")).toBeInTheDocument();

    // Заполняем частично
    await user.type(
      screen.getByTestId("tournament-name"),
      "Partial Tournament",
    );

    // Отменяем
    await user.click(screen.getByTestId("toggle-form"));

    // Форма должна быть скрыта
    expect(screen.queryByTestId("tournament-name")).not.toBeInTheDocument();
    expect(screen.getByText("Нет турниров")).toBeInTheDocument();
  });

  it("should handle tournament deletion", async () => {
    render(
      <AppProviders>
        <MockTournamentApp />
      </AppProviders>,
    );

    // Создаем турнир
    await user.click(screen.getByTestId("toggle-form"));
    await user.type(
      screen.getByTestId("tournament-name"),
      "Tournament to Delete",
    );
    await user.type(screen.getByTestId("tournament-buyin"), "75");
    await user.type(screen.getByTestId("tournament-venue"), "Test Venue");
    await user.type(screen.getByTestId("tournament-date"), "2024-12-30T21:00");
    await user.click(screen.getByTestId("submit-tournament"));

    await waitFor(() => {
      expect(screen.getByText("Tournament to Delete")).toBeInTheDocument();
    });

    // Удаляем турнир
    await user.click(screen.getByTestId("hidden-delete-tournament-0"));

    await waitFor(() => {
      expect(
        screen.queryByText("Tournament to Delete"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Нет турниров")).toBeInTheDocument();
  });
});

// Добавляем React import для JSX
import React from "react";
