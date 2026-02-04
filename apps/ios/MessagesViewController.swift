import UIKit
import Messages

class MessagesViewController: MSMessagesAppViewController {

    // UI
    let stack = UIStackView()
    let toneControl = UISegmentedControl(items: ["Polite", "Direct", "Funny"])
    let shortButtons = (0..<3).map { _ in UIButton(type: .system) }
    let longTextView = UITextView()
    let regenerateButton = UIButton(type: .system)

    // Cache
    var lastCacheKey: String?
    var lastResponse: SuggestionResponse?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    override func didBecomeActive(with conversation: MSConversation) {
        super.didBecomeActive(with: conversation)
        loadSuggestions(conversation: conversation)
    }

    func setupUI() {
        view.backgroundColor = .systemBackground

        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.topAnchor, constant: 12),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -12),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: view.bottomAnchor, constant: -12)
        ])

        toneControl.selectedSegmentIndex = 0
        toneControl.addTarget(self, action: #selector(toneChanged), for: .valueChanged)
        stack.addArrangedSubview(toneControl)

        shortButtons.enumerated().forEach { idx, btn in
            btn.setTitle("...", for: .normal)
            btn.contentHorizontalAlignment = .left
            btn.titleLabel?.numberOfLines = 0
            btn.tag = idx
            btn.addTarget(self, action: #selector(shortTapped(_:)), for: .touchUpInside)
            stack.addArrangedSubview(btn)
        }

        longTextView.isEditable = false
        longTextView.font = .systemFont(ofSize: 16)
        longTextView.layer.borderColor = UIColor.systemGray4.cgColor
        longTextView.layer.borderWidth = 1
        longTextView.layer.cornerRadius = 8
        longTextView.text = "..."
        stack.addArrangedSubview(longTextView)

        regenerateButton.setTitle("Regenerate", for: .normal)
        regenerateButton.addTarget(self, action: #selector(regenerateTapped), for: .touchUpInside)
        stack.addArrangedSubview(regenerateButton)
    }

    @objc func toneChanged() {
        if let conversation = activeConversation {
            loadSuggestions(conversation: conversation, force: true)
        }
    }

    @objc func regenerateTapped() {
        if let conversation = activeConversation {
            loadSuggestions(conversation: conversation, force: true)
        }
    }

    @objc func shortTapped(_ sender: UIButton) {
        guard let text = lastResponse?.short[safe: sender.tag],
              let conversation = activeConversation else { return }
        conversation.insertText(text)
    }

    func loadSuggestions(conversation: MSConversation, force: Bool = false) {
        let text = conversation.messages
            .suffix(6)
            .compactMap { $0.body }
            .joined(separator: "\n")

        let tone = toneControl.titleForSegment(at: toneControl.selectedSegmentIndex) ?? "Polite"
        let cacheKey = "\(tone)|\(text)"

        if !force, cacheKey == lastCacheKey, let cached = lastResponse {
            render(cached)
            return
        }

        fetchSuggestions(text: text, tone: tone) { [weak self] response in
            guard let self = self, let response = response else { return }
            self.lastCacheKey = cacheKey
            self.lastResponse = response
            self.render(response)
        }
    }

    func render(_ response: SuggestionResponse) {
        shortButtons.enumerated().forEach { idx, btn in
            btn.setTitle(response.short[safe: idx] ?? "...", for: .normal)
        }
        longTextView.text = response.long
    }

    func fetchSuggestions(text: String, tone: String, completion: @escaping (SuggestionResponse?) -> Void) {
        guard let url = URL(string: "https://YOUR_BACKEND/suggest") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "text": text,
            "tone": tone.lowercased()
        ])

        URLSession.shared.dataTask(with: req) { data, _, _ in
            guard let data = data,
                  let resp = try? JSONDecoder().decode(SuggestionResponse.self, from: data)
            else { completion(nil); return }
            DispatchQueue.main.async { completion(resp) }
        }.resume()
    }
}

struct SuggestionResponse: Codable {
    let short: [String]
    let long: String
}

extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}
